/**
 * LegalEase deterministic guardrails.
 *
 * Pure functions only. No I/O, no LLM calls, no data-service access.
 * All four guard functions are unit-testable in isolation.
 */

export interface ScopeVerdict {
  readonly inScope: boolean;
  readonly category: 'legal_pk' | 'out_of_scope' | 'dangerous';
  readonly matchedSignal: string;
}

/**
 * Domain groups for Pakistani law.
 *
 * Each entry carries a `label` (returned as matchedSignal) and `keywords`
 * (any of which triggers a positive match). Groups are evaluated in order,
 * so more-specific domains appear before generic geo-signals.
 */
interface DomainGroup {
  readonly label: string;
  readonly keywords: readonly string[];
}

const PK_LAW_DOMAINS: readonly DomainGroup[] = [
  {
    label: 'criminal',
    keywords: ['criminal', 'penal', 'pakistan penal code', 'ppc', 'punishment for theft',
      'punishment for', 'sentence', 'jail', 'imprisonment', 'offence', 'offense',
      'accused', 'bail', 'prosecution', 'crpc', 'code of criminal procedure'],
  },
  {
    label: 'civil',
    keywords: ['civil suit', 'civil case', 'civil court', 'civil law', 'civil',
      'breach of contract', 'contract act', 'damages', 'injunction', 'plaintiff', 'defendant'],
  },
  {
    label: 'family',
    keywords: ['family', 'divorce', 'nikah', 'khula', 'talaq', 'marriage',
      'muslim family laws ordinance', 'child custody', 'dowry', 'dower', 'mehr'],
  },
  {
    label: 'police',
    keywords: ['police', 'fir', 'first information report', 'law enforcement',
      'station house officer', 'sho', 'arrest', 'investigation'],
  },
  {
    label: 'property',
    keywords: ['property', 'land', 'tenant', 'rent', 'landlord', 'ownership',
      'transfer of property act', 'lease', 'possession', 'eviction', 'real estate'],
  },
  {
    label: 'banking',
    keywords: ['banking', 'bank loan', 'bank account', 'bank charge', 'bank fee',
      'loan', 'finance', 'sbp', 'state bank', 'credit card', 'mortgage', 'debt'],
  },
  {
    label: 'constitution',
    keywords: ['constitution', 'constitutional', 'article 25', 'fundamental right',
      'basic right', 'supreme court', 'high court', 'judicial review', 'parliament'],
  },
  {
    label: 'religious',
    keywords: ['religious', 'religion', 'sharia', 'shariah', 'islamic law', 'fiqh',
      'inheritance', 'wirasat', 'wills', 'halal', 'haram', 'zakat'],
  },
  // Generic Pakistani geo-signals — checked last within PK domains.
  {
    label: 'pakistan',
    keywords: ['pakistan', 'pakistani', 'sindh', 'punjab', 'balochistan',
      'khyber pakhtunkhwa', ' kp ', 'azad kashmir', 'islamabad'],
  },
];

/** Foreign-jurisdiction patterns — checked BEFORE PK signals to prevent false positives. */
const FOREIGN_JURISDICTION_PATTERNS: readonly RegExp[] = [
  /in the united states/i, /in the united kingdom/i, /in the uk\b/i,
  /\bus tax\b/i, /\bus law\b/i, /\buk law\b/i, /\buk divorce\b/i,
  /\bindian penal code\b/i, /\bsaudi\b/i, /\bdubai\b/i,
];

const OUT_OF_SCOPE_PATTERNS: readonly RegExp[] = [
  /\bweather\b/i, /\brecipe\b/i, /\bcricket\b/i, /\bfootball\b/i,
  /\bmovie\b/i, /\bsong\b/i, /\bpython\b/i, /\bjavascript\b/i,
  /\bhomework\b/i, /\bmath\b/i, /\bphone\b/i, /\blaptop\b/i,
  /\bstock price\b/i, /\bbitcoin\b/i,
  /in india/i,
];

const DANGEROUS_PATTERNS: readonly RegExp[] = [
  /how (do i|to|can i) bribe/i,
  /how (do i|to|can i) forge/i,
  /how (do i|to|can i) launder/i,
  /how (do i|to|can i) evade tax/i,
  /how (do i|to|can i) fake\b/i,
  /how (do i|to|can i) (kill|murder|harm)/i,
  /how (do i|to|can i) smuggle/i,
  /how (do i|to|can i) (hack|break into)/i,
];

const hasUrduScript = (text: string): boolean => /[؀-ۿ]/.test(text);

const firstMatch = (text: string, patterns: readonly RegExp[]): string | null => {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0];
  }
  return null;
};

const findPkDomain = (queryLower: string): DomainGroup | null => {
  for (const domain of PK_LAW_DOMAINS) {
    for (const kw of domain.keywords) {
      if (queryLower.includes(kw)) {
        return domain;
      }
    }
  }
  return null;
};

export const checkScope = (query: string): ScopeVerdict => {
  if (!query || !query.trim()) {
    return { inScope: false, category: 'out_of_scope', matchedSignal: 'empty_query' };
  }

  // Dangerous content takes highest priority.
  const dangerous = firstMatch(query, DANGEROUS_PATTERNS);
  if (dangerous) {
    return { inScope: false, category: 'dangerous', matchedSignal: dangerous };
  }

  // Reject foreign jurisdictions before checking PK signals, otherwise a query
  // like "divorce in the UK" would match the 'divorce' PK signal first.
  const foreign = firstMatch(query, FOREIGN_JURISDICTION_PATTERNS);
  if (foreign) {
    return { inScope: false, category: 'out_of_scope', matchedSignal: foreign };
  }

  // Urdu-script queries are presumed to be about Pakistani law.
  if (hasUrduScript(query)) {
    return { inScope: true, category: 'legal_pk', matchedSignal: 'urdu_script' };
  }

  const domain = findPkDomain(query.toLowerCase());
  if (domain) {
    return { inScope: true, category: 'legal_pk', matchedSignal: domain.label };
  }

  const outOfScope = firstMatch(query, OUT_OF_SCOPE_PATTERNS);
  if (outOfScope) {
    return { inScope: false, category: 'out_of_scope', matchedSignal: outOfScope };
  }

  return { inScope: true, category: 'legal_pk', matchedSignal: 'default_allow' };
};

// ============================================================================
// INJECTION DETECTION
// ============================================================================

const INJECTION_PHRASES: readonly string[] = [
  'ignore previous',
  'ignore the above',
  'ignore above',
  'disregard your instructions',
  'disregard the above',
  'new instructions:',
  'you are now',
  'pretend to be',
  'developer mode',
  'jailbreak',
  'reveal your prompt',
  'reveal your system prompt',
  'print your prompt',
  'print your system prompt',
  'print your instructions',
];

const INJECTION_TOKENS: readonly string[] = [
  '</system>',
  '<|im_start|>',
  '<|im_end|>',
  '<|system|>',
  '<|user|>',
  '<|assistant|>',
];

const ROLE_IMPERSONATION = /^\s*(system|assistant|user said)\s*[:\-]/im;

export const detectInjection = (query: string): boolean => {
  if (!query) return false;
  const qLower = query.toLowerCase();

  for (const phrase of INJECTION_PHRASES) {
    if (qLower.includes(phrase)) return true;
  }
  for (const token of INJECTION_TOKENS) {
    if (qLower.includes(token)) return true;
  }
  if (ROLE_IMPERSONATION.test(query)) return true;

  for (const chunk of query.split(/\s+/)) {
    if (chunk.length > 200) return true;
  }

  return false;
};

// ============================================================================
// PII REDACTION (logging only — never alters user input sent to LLM)
// ============================================================================

const CNIC_RE = /\b\d{5}-\d{7}-\d\b/g;
const PK_PHONE_RE = /(\+92[\s-]?|0)3\d{2}[\s-]?\d{7}\b/g;
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const IBAN_RE = /\bPK\d{2}[A-Z0-9]{20}\b/g;

export const redactPii = (text: string): string => {
  if (!text) return text;
  return text
    .replace(CNIC_RE, '[REDACTED_CNIC]')
    .replace(IBAN_RE, '[REDACTED_ACCOUNT]')
    .replace(PK_PHONE_RE, '[REDACTED_PHONE]')
    .replace(EMAIL_RE, '[REDACTED_EMAIL]');
};

// ============================================================================
// ANSWER VALIDATION
// ============================================================================

const REQUIRED_HEADERS = [
  '**Quick answer:**',
  '**What the law says:**',
  '**What you can do next:**',
] as const;

const DISCLAIMER_LINE =
  '> ⚠️ **Important:** This is general legal information, ' +
  'not legal advice. For your specific situation, consult a qualified ' +
  'Pakistani lawyer or your local Bar Council.';

const STATUTE_PATTERN = /\b(section|article|ordinance|act)\s+\d+/i;
const MIN_ANSWER_CHARS = 80;
const MAX_ANSWER_CHARS = 3000;

export interface ValidationResult {
  readonly valid: boolean;
  readonly reason: 'ok' | 'bad_shape' | 'hallucinated_citation' | 'too_short' | 'too_long' | 'disclaimer_appended';
  readonly fixedAnswer: string | null;
}

export const validateAnswer = (
  answer: string,
  sources: ReadonlyArray<unknown>,
): ValidationResult => {
  if (!answer || answer.length < MIN_ANSWER_CHARS) {
    return { valid: false, reason: 'too_short', fixedAnswer: null };
  }
  if (answer.length > MAX_ANSWER_CHARS) {
    return { valid: false, reason: 'too_long', fixedAnswer: null };
  }

  for (const header of REQUIRED_HEADERS) {
    if (!answer.includes(header)) {
      return { valid: false, reason: 'bad_shape', fixedAnswer: null };
    }
  }

  if (STATUTE_PATTERN.test(answer) && sources.length === 0) {
    return { valid: false, reason: 'hallucinated_citation', fixedAnswer: null };
  }

  if (!answer.includes('Important') || !answer.includes('not legal advice')) {
    return {
      valid: true,
      reason: 'disclaimer_appended',
      fixedAnswer: `${answer.trimEnd()}\n\n${DISCLAIMER_LINE}`,
    };
  }

  return { valid: true, reason: 'ok', fixedAnswer: null };
};

// ============================================================================
// SCOPE STATEMENT, RESPONSE TEMPLATE, AND REFUSAL TEMPLATES
// ============================================================================

export const LEGALEASE_SCOPE =
  'LegalEase is a first-pass legal information assistant for non-lawyer ' +
  'Pakistani citizens. It explains laws and procedures in seven domains: ' +
  'Criminal, Civil, Family, Police, Land & Property, Religious, Banking & ' +
  'Financial, and the 1973 Constitution. It explains things in plain ' +
  'English with key Urdu terms. It does NOT draft court filings, give ' +
  'advice on non-Pakistani law, opine on guilt or innocence, or replace a ' +
  'qualified lawyer.';

export const RESPONSE_TEMPLATE_INSTRUCTION = `
RESPONSE FORMAT (you MUST follow this exact Markdown skeleton):

**Quick answer:** <one plain-English sentence, no jargon>

**What the law says:**
- <bullet 1, jargon-free>
- <bullet 2 — the first time a legal term appears, gloss it in Urdu in parentheses, e.g. "theft (چوری)">
- <bullet 3>

**Relevant law:** [<Act name>](<official Pakistan Code URL from AVAILABLE SOURCE LINKS>)
*<one-line layperson summary of why this Act applies>*

**What you can do next:**
1. <concrete action verb: file / visit / contact / request / apply>
2. <concrete action>
3. <when to escalate to a lawyer or specific authority>

> ⚠️ **Important:** This is general legal information, not legal advice. For your specific situation, consult a qualified Pakistani lawyer or your local Bar Council.

WRITING RULES:
- Plain English aimed at someone with NO legal training.
- First time a legal term appears, gloss it in Urdu in parentheses.
- Never use "I think" or "in my opinion" — state what the law says.
- The Important disclaimer line is mandatory and must appear verbatim at the end.
`;

export const REFUSAL_INJECTION =
  "I noticed something unusual in your message that looks like an attempt " +
  "to change how I work. I'm only able to help with Pakistani legal " +
  "questions — please rephrase your question in plain language and I'll " +
  "do my best.";

export const refusalOutOfScope = (matchedSignal: string): string =>
  "LegalEase only covers Pakistani law in seven areas: Criminal, Civil, " +
  "Family, Police, Land & Property, Religious, Banking & Financial, and " +
  "the 1973 Constitution.\n\n" +
  `Your question looks like it's about **${matchedSignal}**, which is ` +
  "outside what I can help with. If you'd like Pakistani-law guidance on a " +
  "related issue, rephrase your question and I'll try again.";

export const REFUSAL_DANGEROUS =
  "I can't help with that. If you have a legitimate concern related to " +
  "your situation — for example, you've been asked to pay a bribe, or " +
  "you're worried about fraud — here's where to report it:\n\n" +
  "- **National Accountability Bureau (NAB)** — corruption reports\n" +
  "- **Federal Investigation Agency (FIA)** — financial / cyber crime\n" +
  "- **Your local police station** — file an FIR\n" +
  "- **Pakistan Citizen's Portal (PCP)** — general grievances";

export const REFUSAL_ZERO_EVIDENCE =
  "I don't have a reliable Pakistani statutory reference for this question " +
  "in my database, so I won't guess. Please:\n\n" +
  "1. Re-check whether your question is about one of the seven covered " +
  "areas above, OR\n" +
  "2. Consult a Pakistani lawyer (your district Bar Council can refer " +
  "you), OR\n" +
  "3. Search the official Pakistan Code at " +
  "[pakistancode.gov.pk](https://pakistancode.gov.pk/english/).";

export const REFUSAL_GENERATION_FAILED =
  "I tried to answer your question but couldn't produce a response in the " +
  "right format. Please rephrase your question more simply (one issue at a " +
  "time), or try again in a moment.";
