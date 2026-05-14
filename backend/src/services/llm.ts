import Groq from 'groq-sdk';
import {
  ChatMessage,
  ContractAnalysis,
  IntentClassification,
  QueryClassification,
  RiskItem,
  MissingClause,
  ApplicableLaw,
} from '../types/index.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const groq = new Groq({ apiKey: GROQ_API_KEY || 'missing-key' });

const LEGAL_CATEGORIES = [
  'criminal_laws',
  'civil_laws',
  'family_laws',
  'banking_laws',
  'land_property_law',
  'police_laws',
  'religious_laws',
  'pakistan_constitution',
  'service_laws',
  'labour_laws',
  'companies_laws',
];

// All defaults are the SMALL / fast Groq models:
//   - llama-3.1-8b-instant: Groq's smallest chat model (8B params).
//   - llama-4-scout: MoE vision model, only ~3.5B active params per token.
//   - whisper-large-v3-turbo: fast multilingual whisper (currently recommended by Groq).
//     Note: distil-whisper-large-v3-en was decommissioned by Groq, so we default both
//     English and multilingual transcription to whisper-large-v3-turbo.
// Override via env if you want different models.
const MODEL_ID = process.env.GROQ_MODEL_ID || 'llama-3.1-8b-instant';
const VISION_MODEL_ID = process.env.GROQ_VISION_MODEL_ID || 'meta-llama/llama-4-scout-17b-16e-instruct';
const TRANSCRIBE_MODEL_EN = process.env.GROQ_TRANSCRIBE_MODEL_EN || 'whisper-large-v3-turbo';
const TRANSCRIBE_MODEL_MULTI = process.env.GROQ_TRANSCRIBE_MODEL_MULTI || 'whisper-large-v3-turbo';
const MAX_HISTORY_MESSAGES = 1;
const MAX_PROMPT_CHARS = 800;
const MAX_HISTORY_CHARS = 150;
const MAX_QUERY_CHARS = 200;
const MAX_CONTRACT_CHARS = 2500;
const CHAT_MAX_TOKENS = 400;
const FALLBACK_MAX_TOKENS = 250;

const isTokenLimitError = (error: unknown): boolean => {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  return (
    lower.includes('413')
    || lower.includes('request too large')
    || lower.includes('rate_limit_exceeded')
    || lower.includes('tokens per minute')
  );
};

const compactText = (value: string, maxChars: number): string => {
  const text = String(value || '').trim();
  if (text.length <= maxChars) return text;
  return `${text.substring(0, maxChars)}\n\n[Prompt compacted for model limits]`;
};

const ENHANCED_ANALYSIS_PROMPT = `You are LegalEase, a Pakistani legal expert. Analyze this contract and return ONLY valid JSON (no markdown).

CONTRACT:
{{contract_text}}

Return exactly this JSON structure:
{"document_type":"contract type","parties":["names"],"summary":"2-3 sentence summary","compliance_score":60,"overall_risk":"critical|high|medium|low","risks":[{"severity":"critical|high|medium|low","category":"Payment|Jurisdiction|Termination|Liability|Confidentiality|Dispute","title":"short title","description":"why it is a risk","original_clause":"text or null","suggested_fix":"fixed clause or null","law_reference":"PK law or null"}],"missing_clauses":[{"title":"clause name","why_needed":"reason","suggested_text":"draft text","law_reference":"law or null"}],"applicable_laws":[{"name":"law","year":"year","relevance":"how it applies","key_sections":["Section X"]}],"recommendations":["step1","step2","step3"],"timeline":"2-4 weeks","estimated_cost":"PKR 25000-100000","key_dates":["dates"],"jurisdiction":"Pakistan"}

Scoring: start 100, deduct 20 per critical risk, 10 per high, 5 per medium, 2 per missing clause, min 5.
Reference Contract Act 1872, Specific Relief Act 1877, Arbitration Act 1940, Transfer of Property Act 1882 as applicable.
Find 3-5 risks and 2-3 missing clauses specific to this contract.`;

const fallbackAnalysis = (): ContractAnalysis => ({
  document_type: 'Legal Agreement',
  parties: [],
  summary:
    'Automated analysis could not be completed. Please have this contract reviewed by a qualified Pakistani legal professional to ensure compliance and protect your interests.',
  compliance_score: 50,
  overall_risk: 'high',
  risks: [
    {
      severity: 'high',
      category: 'General',
      title: 'Manual review required',
      description:
        'Automated analysis encountered an issue. The contract should be reviewed manually to identify specific risks and problematic clauses.',
      original_clause: null,
      suggested_fix: null,
      law_reference: 'Contract Act 1872',
    },
  ],
  missing_clauses: [
    {
      title: 'Governing law and jurisdiction',
      why_needed:
        'Every contract must specify which law governs it and which courts have jurisdiction. Without this, disputes become very difficult to resolve.',
      suggested_text:
        'This Agreement shall be governed by and construed in accordance with the laws of Pakistan. Any dispute arising under or in connection with this Agreement shall be subject to the exclusive jurisdiction of the courts of [City], Pakistan.',
      law_reference: 'Contract Act 1872',
    },
  ],
  applicable_laws: [
    {
      name: 'Contract Act 1872',
      year: '1872',
      relevance: 'Governs all aspects of contract formation, performance and breach in Pakistan.',
      key_sections: [
        'Section 73 - Compensation for breach',
        'Section 74 - Liquidated damages',
      ],
    },
  ],
  recommendations: [
    'Seek immediate review from a Pakistani legal expert',
    'Verify compliance with Contract Act 1872 and Specific Relief Act 1877',
    'Ensure all parties\' rights and obligations are clearly defined',
    'Add proper signatures and witness requirements per Pakistani law',
    'Include clear dispute resolution mechanism',
  ],
  timeline: '2-4 weeks for comprehensive legal review',
  estimated_cost: 'PKR 25,000 - 100,000 depending on contract complexity',
  key_dates: [],
  jurisdiction: 'Pakistan (unspecified)',
});

const normaliseSeverity = (v: unknown): RiskItem['severity'] => {
  const s = String(v || 'medium').toLowerCase();
  if (s === 'critical' || s === 'high' || s === 'medium' || s === 'low') return s;
  return 'medium';
};

const CONTRACT_KEYWORDS = [
  'agreement', 'contract', 'clause', 'hereinafter', 'whereas', 'party of the first',
  'undertakes', 'indemnify', 'consideration', 'governing law', 'jurisdiction',
  'terminate', 'obligation', 'lessor', 'lessee', 'landlord', 'tenant',
  'employer', 'employee', 'vendor', 'purchaser',
];

const isLikelyContract = (text: string): boolean => {
  const lower = text.toLowerCase();
  const hits = CONTRACT_KEYWORDS.filter((kw) => lower.includes(kw)).length;
  return hits >= 3 || lower.length > 3000;
};

const stripJsonFences = (raw: string): string => {
  let s = raw.trim();
  if (s.startsWith('```')) {
    s = s.substring(s.indexOf('\n') + 1);
    const endFence = s.lastIndexOf('```');
    if (endFence !== -1) s = s.substring(0, endFence);
  }
  return s.trim();
};

export const llmService = {
  async classifyQuery(
    query: string,
    hasDocument: boolean,
    documentType: string
  ): Promise<IntentClassification> {
    const queryLower = query.toLowerCase();
    const docKeywords = ['analyze', 'review', 'check', 'understand', 'explain', 'what is', 'document', 'contract'];
    const legalKeywords = ['law', 'legal', 'act', 'section', 'right', 'guide', 'procedure', 'process'];

    const hasDocKeywords = docKeywords.some((kw) => queryLower.includes(kw));
    const hasLegalKeywords = legalKeywords.some((kw) => queryLower.includes(kw));

    if (hasDocument && hasDocKeywords && !hasLegalKeywords) {
      return { intent: 'document_analysis', needs_rag: false, confidence: 0.9 };
    }
    if (!hasDocument && hasLegalKeywords) {
      return { intent: 'legal_query', needs_rag: true, confidence: 0.85 };
    }
    if (hasDocument && (hasDocKeywords || hasLegalKeywords)) {
      return { intent: 'mixed', needs_rag: true, confidence: 0.8 };
    }
    return {
      intent: hasDocument ? 'document_analysis' : 'legal_query',
      needs_rag: !hasDocument || hasLegalKeywords,
      confidence: 0.7,
    };
  },

  async classifyLegalQuery(query: string): Promise<QueryClassification> {
    const greetings = ['hi', 'hello', 'hey', 'greetings', 'howdy'];
    const q = query.toLowerCase().trim();
    if (greetings.some((g) => q === g || q.startsWith(g + ' ') || q.startsWith(g + ','))) {
      return { query_type: 'greeting', confidence: 0.95 };
    }
    const detectedCategory = LEGAL_CATEGORIES.find((cat) =>
      q.includes(cat.replace(/_/g, ' '))
    );
    return { query_type: 'legal_analysis', confidence: 0.8, category: detectedCategory };
  },

  async generateResponse(
    query: string,
    conversationHistory: ChatMessage[],
    systemPrompt: string,
    maxTokens = 2000
  ): Promise<string> {
    try {
      if (!GROQ_API_KEY || GROQ_API_KEY === 'missing-key') {
        console.error('GROQ_API_KEY is not configured. Set GROQ_API_KEY environment variable.');
        throw new Error('LLM service not configured. Please set GROQ_API_KEY environment variable.');
      }

      const effectiveMax = Math.min(maxTokens, CHAT_MAX_TOKENS);
      const messages = [
        { role: 'system' as const, content: compactText(systemPrompt, MAX_PROMPT_CHARS) },
        ...conversationHistory.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: compactText(m.content, MAX_HISTORY_CHARS),
        })),
        { role: 'user' as const, content: compactText(query, MAX_QUERY_CHARS) },
      ];

      try {
        const response = await groq.chat.completions.create({
          model: MODEL_ID,
          messages,
          temperature: 0.3,
          max_tokens: effectiveMax,
        });
        return response.choices[0]?.message?.content || 'Error generating response';
      } catch (primaryError) {
        if (!isTokenLimitError(primaryError)) {
          throw primaryError;
        }

        const compactMessages = [
          {
            role: 'system' as const,
            content: 'You are LegalEase, a Pakistani legal assistant. Reply in 2-4 short bullet points.',
          },
          { role: 'user' as const, content: compactText(query, 180) },
        ];

        const fallbackResponse = await groq.chat.completions.create({
          model: MODEL_ID,
          messages: compactMessages,
          temperature: 0.2,
          max_tokens: FALLBACK_MAX_TOKENS,
        });

        return fallbackResponse.choices[0]?.message?.content || 'Error generating response';
      }
    } catch (error) {
      console.error('LLM generateResponse Error:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  },

  async transcribeAudio(fileBuffer: Buffer, filename: string, mimeType: string, language?: string): Promise<string> {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'missing-key') {
      throw new Error('LLM service not configured. Please set GROQ_API_KEY environment variable.');
    }

    const safeMime = mimeType || 'audio/webm';
    const safeName = filename || `audio.${safeMime.split('/')[1]?.split(';')[0] || 'webm'}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const FileCtor = (globalThis as any).File;
    if (!FileCtor) {
      throw new Error('File API unavailable in this runtime — Node 20+ required.');
    }
    const file = new FileCtor([fileBuffer], safeName, { type: safeMime });

    // Pick the smallest model that can handle the language: English → distil (smallest),
    // anything else (Urdu, auto-detect) → turbo (smallest multilingual).
    const normalizedLang = language && language !== 'auto' ? language.toLowerCase().split('-')[0] : '';
    const isEnglishOnly = normalizedLang === 'en';
    const model = isEnglishOnly ? TRANSCRIBE_MODEL_EN : TRANSCRIBE_MODEL_MULTI;

    const result = await groq.audio.transcriptions.create({
      file,
      model,
      language: normalizedLang || undefined,
      response_format: 'json',
      temperature: 0,
    });

    const text = (result as { text?: string }).text?.trim() || '';
    return text;
  },

  async ocrImageWithVision(fileBuffer: Buffer, mimeType: string): Promise<string> {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'missing-key') {
      throw new Error('LLM service not configured. Please set GROQ_API_KEY environment variable.');
    }
    const safeMime = mimeType && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';
    const base64 = fileBuffer.toString('base64');
    const dataUrl = `data:${safeMime};base64,${base64}`;

    const response = await groq.chat.completions.create({
      model: VISION_MODEL_ID,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract ALL readable text from this image exactly as written. Preserve both English and Urdu text. Do NOT translate, summarise, or add commentary. Return only the raw extracted text. If the image has no readable text, reply with exactly: NO_TEXT.',
            },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 1200,
    });

    const text = (response.choices[0]?.message?.content || '').trim();
    if (!text || text === 'NO_TEXT') {
      return 'No text detected in image';
    }
    return text.replace(/\s+/g, ' ').trim();
  },

  async analyzeContract(contractText: string): Promise<ContractAnalysis> {
    if (!contractText || contractText.trim().length < 200) {
      throw new Error('Document too short or empty to be a contract.');
    }

    if (!isLikelyContract(contractText)) {
      throw new Error(
        'This document does not appear to be a contract or legal agreement. Please upload a contract for analysis.'
      );
    }

    const prompt = ENHANCED_ANALYSIS_PROMPT.replace('{{contract_text}}', contractText.substring(0, MAX_CONTRACT_CHARS));

    try {
      const response = await groq.chat.completions.create({
        model: MODEL_ID,
        messages: [
          {
            role: 'system',
            content: 'Return ONLY valid JSON. No markdown. No extra text.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 1500,
      });

      const rawContent = response.choices[0]?.message?.content || '';
      const clean = stripJsonFences(rawContent);
      const data = JSON.parse(clean);

      let score = Number(data.compliance_score ?? 60);
      if (!Number.isFinite(score)) score = 60;
      score = Math.max(5, Math.min(100, Math.round(score)));

      const overallRaw = String(data.overall_risk || 'medium').toLowerCase();
      const overallRisk: ContractAnalysis['overall_risk'] =
        overallRaw === 'critical' || overallRaw === 'high' || overallRaw === 'medium' || overallRaw === 'low'
          ? overallRaw
          : 'medium';

      const risks: RiskItem[] = Array.isArray(data.risks)
        ? data.risks.slice(0, 8).map((r: any) => ({
            severity: normaliseSeverity(r?.severity),
            category: String(r?.category || 'General'),
            title: String(r?.title || 'Risk identified'),
            description: String(r?.description || ''),
            original_clause: r?.original_clause ?? null,
            suggested_fix: r?.suggested_fix ?? null,
            law_reference: r?.law_reference ?? null,
          }))
        : [];

      const missing_clauses: MissingClause[] = Array.isArray(data.missing_clauses)
        ? data.missing_clauses.slice(0, 6).map((m: any) => ({
            title: String(m?.title || 'Missing clause'),
            why_needed: String(m?.why_needed || ''),
            suggested_text: String(m?.suggested_text || ''),
            law_reference: m?.law_reference ?? null,
          }))
        : [];

      const applicable_laws: ApplicableLaw[] = Array.isArray(data.applicable_laws)
        ? data.applicable_laws.slice(0, 6).map((l: any) => ({
            name: String(l?.name || ''),
            year: l?.year != null ? String(l.year) : null,
            relevance: String(l?.relevance || ''),
            key_sections: Array.isArray(l?.key_sections) ? l.key_sections.map(String) : [],
          }))
        : [];

      const recommendations: string[] =
        Array.isArray(data.recommendations) && data.recommendations.length > 0
          ? data.recommendations.map(String)
          : [
              'Have this contract reviewed by a Pakistani legal expert',
              'Ensure compliance with Contract Act 1872',
              'Add all missing standard clauses before signing',
              'Clarify all ambiguous terms in writing',
              'Specify jurisdiction and dispute resolution mechanism',
            ];

      return {
        document_type: String(data.document_type || 'Legal Agreement'),
        parties: Array.isArray(data.parties) ? data.parties.map(String) : [],
        summary: String(data.summary || 'Contract analysis completed.'),
        compliance_score: score,
        overall_risk: overallRisk,
        risks,
        missing_clauses,
        applicable_laws,
        recommendations,
        timeline: String(data.timeline || '2-4 weeks'),
        estimated_cost: String(data.estimated_cost || 'PKR 25,000 - 100,000'),
        key_dates: Array.isArray(data.key_dates) ? data.key_dates.map(String) : [],
        jurisdiction: String(data.jurisdiction || 'Pakistan (jurisdiction unspecified)'),
      };
    } catch (error) {
      console.error('Enhanced contract analysis error:', error);
      return fallbackAnalysis();
    }
  },
};
