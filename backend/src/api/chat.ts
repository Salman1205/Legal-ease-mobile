import { Router, Request, Response } from 'express';
import { ChatRequest, ChatResponse, SourceInfo, RefusalReason } from '../types/index.js';
import { llmService } from '../services/llm.js';
import { searchService, LAW_REFERENCE_LINKS } from '../services/search.js';
import {
  checkScope,
  detectInjection,
  redactPii,
  validateAnswer,
  isLegalDocument,
  LEGALEASE_SCOPE,
  RESPONSE_TEMPLATE_INSTRUCTION,
  REFUSAL_INJECTION,
  refusalOutOfScope,
  REFUSAL_DANGEROUS,
  REFUSAL_ZERO_EVIDENCE,
  REFUSAL_GENERATION_FAILED,
  REFUSAL_NOT_A_LEGAL_DOCUMENT,
} from '../services/guardrails.js';

export const chatRouter = Router();

const MAX_DOCUMENT_CHARS_FOR_LLM = 1200;
const MAX_LEGAL_RESULTS_FOR_PROMPT = 2;
const MAX_LEGAL_SNIPPET_CHARS = 220;

const truncateDocumentContext = (context: string, maxLength = MAX_DOCUMENT_CHARS_FOR_LLM): string => {
  if (!context || context.length <= maxLength) return context;
  return `${context.substring(0, maxLength)}\n\n[Document truncated — showing first ${maxLength} characters of ${context.length} total]`;
};

const detectDocumentType = (documentName?: string): 'image' | 'text' | '' => {
  if (!documentName) return '';
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(documentName) ? 'image' : 'text';
};

const refusalResponse = (message: string, reason: RefusalReason): ChatResponse => ({
  response: message,
  sources: [],
  collections_used: [],
  status: 'refused',
  refusal_reason: reason,
});

chatRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = (req.body || {}) as ChatRequest;
    const { message, conversation_history, document_name, mode } = body;
    let { document_context } = body;

    if (!message || !message.trim()) {
      res.status(400).json({ success: false, message: 'Message cannot be empty' });
      return;
    }

    // Use redacted text for logging — never write CNIC/phone/email to logs.
    console.log(`Chat request: ${redactPii(message).substring(0, 80)}...`);

    // ── GUARDRAIL: prompt injection ────────────────────────────────────────
    if (detectInjection(message)) {
      console.warn('Refusal: injection detected');
      res.json(refusalResponse(REFUSAL_INJECTION, 'injection'));
      return;
    }

    // ── GUARDRAIL: scope check ─────────────────────────────────────────────
    const verdict = checkScope(message);
    if (verdict.category === 'dangerous') {
      console.warn(`Refusal: dangerous (${verdict.matchedSignal})`);
      res.json(refusalResponse(REFUSAL_DANGEROUS, 'dangerous'));
      return;
    }
    if (!verdict.inScope) {
      console.warn(`Refusal: out_of_scope (${verdict.matchedSignal})`);
      res.json(refusalResponse(refusalOutOfScope(verdict.matchedSignal), 'out_of_scope'));
      return;
    }

    if (document_context) {
      const originalLength = document_context.length;
      document_context = truncateDocumentContext(document_context);
      if (document_context.length < originalLength) {
        console.log(`Document truncated from ${originalLength} to ${document_context.length} characters`);
      }
    }

    const hasDocument = !!document_context && document_context.trim().length > 0;
    const isLawyerMode = mode === 'lawyer';
    const documentType = detectDocumentType(document_name);

    const intentClassification = await llmService.classifyQuery(message, hasDocument, documentType);
    console.log(`Intent: ${intentClassification.intent}, Needs RAG: ${intentClassification.needs_rag}`);

    let sources: SourceInfo[] = [];
    let collectionsUsed: string[] = [];
    let systemPrompt = '';

    if (hasDocument && document_context) {
      if (intentClassification.intent === 'document_analysis' && !isLawyerMode) {
        if (!isLegalDocument(document_context)) {
          console.warn('Refusal: uploaded document is not a legal document');
          res.json(refusalResponse(REFUSAL_NOT_A_LEGAL_DOCUMENT, 'not_a_legal_document'));
          return;
        }

        systemPrompt = `You are LegalEase, an AI legal assistant for Pakistani law.

The user has uploaded a LEGAL document and is asking about it.

IMPORTANT: Begin your response by stating the document type in the format:
"This appears to be a [contract / FIR / court notice / legal notice / ordinance / deed / other legal document]."

Then analyze the document content.

DOCUMENT (${(documentType || 'text').toUpperCase()}):
${document_context}

USER QUESTION: ${message}

INSTRUCTIONS:
- State the document type as the first sentence.
- Carefully analyze the document.
- Answer the user's specific question.
- If it's legal text, explain in simple terms.
- Be direct and helpful.`;
      } else {
        const searchResults = await searchService.searchLegalContext(message, 10);
        sources = searchService.formatResults(searchResults);
        collectionsUsed = ['general'];

        const legalContext = searchResults
          .slice(0, MAX_LEGAL_RESULTS_FOR_PROMPT)
          .map((r) => {
            const compact = String(r.text || '').substring(0, MAX_LEGAL_SNIPPET_CHARS);
            return `[${r.law} - ${r.title}]\n${compact}${r.text.length > MAX_LEGAL_SNIPPET_CHARS ? '...' : ''}`;
          })
          .join('\n\n');

        systemPrompt = `You are LegalEase. ${LEGALEASE_SCOPE}

DOCUMENT:
${document_context.substring(0, 800)}

LEGAL CONTEXT:
${legalContext || 'No specific legal provisions found.'}

${LAW_REFERENCE_LINKS}

${RESPONSE_TEMPLATE_INSTRUCTION}

Answer the user's question using both the document and the legal context. Reference specific laws/sections.`;
      }
    } else {
      const legalClassification = await llmService.classifyLegalQuery(message);

      if (legalClassification.query_type === 'greeting' && !isLawyerMode) {
        systemPrompt =
          'You are LegalEase, a friendly AI legal assistant for Pakistani law. Respond naturally and briefly (2-3 sentences). DO NOT mention laws or sections.';
      } else {
        const searchResults = await searchService.searchLegalContext(message, 5);
        sources = searchService.formatResults(searchResults);
        collectionsUsed = ['general'];

        const legalContext = searchResults
          .slice(0, MAX_LEGAL_RESULTS_FOR_PROMPT)
          .map((r) => {
            const compact = String(r.text || '').substring(0, MAX_LEGAL_SNIPPET_CHARS);
            return `[${r.law} - ${r.title}]\n${compact}${r.text.length > MAX_LEGAL_SNIPPET_CHARS ? '...' : ''}`;
          })
          .join('\n\n');

        if (searchResults.length === 0) {
          systemPrompt = `You are LegalEase. ${LEGALEASE_SCOPE}

The database search found no directly relevant sections. Provide GENERAL Pakistani legal principles. Do NOT cite a specific Section/Article number you are not certain of. Recommend consulting a lawyer.

${LAW_REFERENCE_LINKS}

${RESPONSE_TEMPLATE_INSTRUCTION}`;
        } else {
          systemPrompt = `You are LegalEase. ${LEGALEASE_SCOPE}

CRITICAL RULES:
1. ONLY cite Sections/Articles/Acts that appear in DATABASE CONTEXT below.
2. Some sources may be from older laws — note if they may have been amended.
3. Provide practical, actionable advice along with legal references.

DATABASE CONTEXT:
${legalContext}

${LAW_REFERENCE_LINKS}

${RESPONSE_TEMPLATE_INSTRUCTION}`;
        }
      }
    }

    const response = await llmService.generateResponse(
      message,
      conversation_history || [],
      systemPrompt,
      400
    );

    // ── GUARDRAIL: validate LLM output ─────────────────────────────────────
    const validation = validateAnswer(response, sources);
    if (!validation.valid) {
      if (validation.reason === 'hallucinated_citation') {
        console.warn('Refusal: hallucinated citation with zero sources');
        res.json(refusalResponse(REFUSAL_ZERO_EVIDENCE, 'zero_evidence'));
        return;
      }
      console.warn(`Validation failed: ${validation.reason}`);
      res.json(refusalResponse(REFUSAL_GENERATION_FAILED, 'generation_failed'));
      return;
    }

    const finalResponse = validation.fixedAnswer ?? response;
    const chatResponse: ChatResponse = {
      response: finalResponse,
      sources,
      collections_used: collectionsUsed,
      status: 'success',
    };
    res.json(chatResponse);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Chat endpoint error:', errorMsg);
    
    let userMessage = 'An error occurred. ';
    if (errorMsg.includes('GROQ_API_KEY') || errorMsg.includes('not configured')) {
      userMessage = 'LLM service not available. Please try again later.';
    } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
      userMessage = 'API authentication failed. Please contact support.';
    } else if (errorMsg.includes('timeout') || errorMsg.includes('429')) {
      userMessage = 'Service is busy. Please try again in a moment.';
    } else if (errorMsg.includes('413') || errorMsg.includes('Request too large') || errorMsg.includes('rate_limit_exceeded')) {
      userMessage = 'Your request is too large for the current AI model. Please try a shorter question or smaller document excerpt.';
    } else {
      userMessage += errorMsg;
    }
    
    const lowered = errorMsg.toLowerCase();
    const statusCode =
      lowered.includes('413') || lowered.includes('request too large')
        ? 413
        : lowered.includes('429') || lowered.includes('rate_limit_exceeded') || lowered.includes('tokens per minute')
          ? 429
          : 500;

    res.status(statusCode).json({
      response: userMessage,
      sources: [],
      collections_used: [],
      status: 'error',
      error: errorMsg,
    });
  }
});
