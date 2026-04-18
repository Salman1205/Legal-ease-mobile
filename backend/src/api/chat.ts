import { Router, Request, Response } from 'express';
import { ChatRequest, ChatResponse, SourceInfo } from '../types/index.js';
import { llmService } from '../services/llm.js';
import { searchService } from '../services/search.js';

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

chatRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = (req.body || {}) as ChatRequest;
    const { message, conversation_history, document_name, mode } = body;
    let { document_context } = body;

    if (!message || !message.trim()) {
      res.status(400).json({ success: false, message: 'Message cannot be empty' });
      return;
    }

    console.log(`Chat request: ${message.substring(0, 80)}...`);

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
        systemPrompt = `You are LegalEase, an AI legal assistant for Pakistani law.

The user has uploaded a document and is asking about it. Focus on analyzing the document content.

DOCUMENT (${(documentType || 'text').toUpperCase()}):
${document_context}

USER QUESTION: ${message}

INSTRUCTIONS:
- Carefully analyze the document
- Answer the user's specific question
- If it's legal text, explain in simple terms
- Be direct and helpful`;
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

        systemPrompt = `You are LegalEase, an AI legal assistant for Pakistani law.

DOCUMENT:
${document_context.substring(0, 800)}

LEGAL CONTEXT:
${legalContext || 'No specific legal provisions found.'}

Answer the user's question using the document and legal context. Reference specific laws/sections. Be concise.`;
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
          systemPrompt =
            'You are LegalEase, an AI legal assistant for Pakistani law. The database search found no directly relevant sections. Provide GENERAL legal guidance based on Pakistani legal principles. Suggest what type of laws would typically apply. Recommend consulting a lawyer.';
        } else {
          systemPrompt = `You are LegalEase, an AI legal assistant for Pakistani law.

DATABASE CONTEXT:
${legalContext}

Provide a structured response with:
- Overview of the situation
- Relevant legal provisions (from DATABASE only)
- Practical advice and next steps
- Note if consulting a lawyer is recommended`;
        }
      }
    }

    const response = await llmService.generateResponse(
      message,
      conversation_history || [],
      systemPrompt,
      400
    );

    const chatResponse: ChatResponse = {
      response,
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
