# Guardrail Bug Fixes — Implementation Plan

**Goal:** Implement the fixes approved in `2026-05-14-guardrail-bugfixes-design.md`. Single subagent task; small focused scope.

**Tech stack:** TypeScript + Express backend (`legal-mobile/backend/`), vitest tests already wired.

---

## Task 1: Combined bug fix

**Files (5):**
- Modify: `legal-mobile/backend/src/services/guardrails.ts`
- Modify: `legal-mobile/backend/src/types/index.ts`
- Modify: `legal-mobile/backend/src/api/chat.ts`
- Modify: `legal-mobile/backend/tests/guardrails.test.ts`
- Modify: `legal-mobile/backend/tests/chat.endpoint.test.ts`

### Step 1: Expand legal-vocabulary in `checkScope` + flip default to deny

Open `legal-mobile/backend/src/services/guardrails.ts`. The Task 2 implementer used a `DomainGroup[]` structure instead of a flat `PK_LAW_SIGNALS` array. Read the file first to see the current structure.

Add a new generic-legal-vocabulary group OR extend the existing per-domain groups with these terms (case-insensitive substring match):

```
court, lawyer, advocate, judge, magistrate, rights, sentence, fine,
sue, lawsuit, eviction, custody, alimony, arrest, bail, contract,
will, inheritance, ordinance, statute, jurisdiction, plaintiff,
defendant, hearing, appeal, legal, deed, summons, petition
```

These should map to a generic `'legal_general'` or similar domain label so `checkScope` returns `inScope: true` when one matches.

Then locate the final fallback in `checkScope`:
```typescript
return { inScope: true, category: 'legal_pk', matchedSignal: 'default_allow' };
```
Replace with:
```typescript
return { inScope: false, category: 'out_of_scope', matchedSignal: 'no_legal_signal_detected' };
```

### Step 2: Add `isLegalDocument` to `guardrails.ts`

Append after the existing `redactPii` section (or wherever it fits the file's section order):

```typescript
// ============================================================================
// LEGAL DOCUMENT DETECTION
// ============================================================================

const LEGAL_DOCUMENT_KEYWORDS: readonly string[] = [
  'agreement', 'contract', 'party', 'parties', 'hereby', 'witnesseth',
  'fir', 'notice', 'plaintiff', 'defendant', 'court', 'ordinance',
  'section', 'clause', 'undersigned', 'jurisdiction', 'governing law',
  'lessor', 'lessee', 'landlord', 'tenant', 'deed', 'summons', 'petition',
  'writ', 'complaint', 'judgment', 'decree', 'magistrate', 'shall be',
];

const LEGAL_DOC_KEYWORD_THRESHOLD = 2;
const LEGAL_DOC_SCAN_CHARS = 800;

/**
 * Returns true if the first 800 characters of the document contain
 * at least 2 distinct legal-document keywords. The 2-keyword threshold
 * avoids false positives on incidental matches (e.g., "tennis court"
 * in a resume).
 */
export const isLegalDocument = (documentText: string): boolean => {
  if (!documentText || documentText.length < 20) return false;
  const head = documentText.substring(0, LEGAL_DOC_SCAN_CHARS).toLowerCase();
  const matched = new Set<string>();
  for (const kw of LEGAL_DOCUMENT_KEYWORDS) {
    if (head.includes(kw)) matched.add(kw);
    if (matched.size >= LEGAL_DOC_KEYWORD_THRESHOLD) return true;
  }
  return false;
};
```

### Step 3: Add `REFUSAL_NOT_A_LEGAL_DOCUMENT` constant

Append in the existing refusals section of `guardrails.ts`:

```typescript
export const REFUSAL_NOT_A_LEGAL_DOCUMENT =
  "I can only analyze legal documents (contracts, FIRs, court notices, " +
  "legal notices, ordinances, deeds, etc.). The document you uploaded " +
  "does not look like a legal document. If this was meant to be a legal " +
  "document, please double-check the file you uploaded and try again.";
```

### Step 4: Extend `RefusalReason` in `types/index.ts`

Find:
```typescript
export type RefusalReason =
  | 'injection'
  | 'out_of_scope'
  | 'dangerous'
  | 'zero_evidence'
  | 'generation_failed';
```
Replace with:
```typescript
export type RefusalReason =
  | 'injection'
  | 'out_of_scope'
  | 'dangerous'
  | 'zero_evidence'
  | 'generation_failed'
  | 'not_a_legal_document';
```

### Step 5: Wire `isLegalDocument` + new refusal into `chat.ts`

Open `legal-mobile/backend/src/api/chat.ts`. Add `isLegalDocument` and `REFUSAL_NOT_A_LEGAL_DOCUMENT` to the import block from `../services/guardrails.js`.

Find the document_analysis branch (the `if (intentClassification.intent === 'document_analysis' && !isLawyerMode)` block). Insert BEFORE the existing `systemPrompt = ...` assignment:

```typescript
        if (!isLegalDocument(document_context)) {
          console.warn('Refusal: uploaded document is not a legal document');
          res.json(refusalResponse(REFUSAL_NOT_A_LEGAL_DOCUMENT, 'not_a_legal_document'));
          return;
        }
```

Then update the existing `systemPrompt` for the document_analysis branch — prepend a line requiring the LLM to state document type up front:

```typescript
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
```

### Step 6: Add tests to `guardrails.test.ts`

Append at the end:

```typescript
import { isLegalDocument } from '../src/services/guardrails.js';

describe('checkScope — default-deny (new)', () => {
  const refusedQueries = [
    'How do I reverse a linked list?',
    'Explain quantum physics in simple terms',
    'What is the capital of France?',
    'Tell me a poem about love',
    'Write me a haiku about cats',
  ];
  for (const q of refusedQueries) {
    it(`refuses non-legal: ${q.slice(0, 35)}`, () => {
      const v = checkScope(q);
      expect(v.inScope).toBe(false);
      expect(v.category).toBe('out_of_scope');
    });
  }
});

describe('checkScope — general legal vocabulary now in-scope', () => {
  const inScopeQueries = [
    'Can I sue my employer for unpaid wages?',
    'What are my rights as a worker?',
    'Do I have grounds for an appeal?',
    'How does the eviction process work?',
    'What does the court need for a divorce?',
  ];
  for (const q of inScopeQueries) {
    it(`accepts general legal: ${q.slice(0, 35)}`, () => {
      const v = checkScope(q);
      expect(v.inScope).toBe(true);
      expect(v.category).toBe('legal_pk');
    });
  }
});

describe('isLegalDocument', () => {
  it('recognizes a contract', () => {
    const text = 'THIS AGREEMENT is entered into between the parties hereby agreeing to the following clauses. The party of the first part shall...';
    expect(isLegalDocument(text)).toBe(true);
  });

  it('recognizes an FIR', () => {
    const text = 'FIR No. 234/2025\nComplainant: Mr X\nSection 379 PPC. The undersigned officer of the court hereby records...';
    expect(isLegalDocument(text)).toBe(true);
  });

  it('rejects a resume', () => {
    const text = 'John Doe\nSoftware Engineer\nExperience: 5 years at TechCorp building React applications. Skilled in JavaScript, TypeScript, and Node.js.';
    expect(isLegalDocument(text)).toBe(false);
  });

  it('rejects a recipe', () => {
    const text = 'Chicken Biryani Recipe\nIngredients: 2 cups basmati rice, 1 kg chicken, onions, yogurt. Preheat the oven to 350F. Marinate the chicken for 2 hours.';
    expect(isLegalDocument(text)).toBe(false);
  });

  it('rejects source code', () => {
    const text = 'function reverseLinkedList(head) {\n  let prev = null;\n  let current = head;\n  while (current) {\n    const next = current.next;\n    current.next = prev;\n  }\n}';
    expect(isLegalDocument(text)).toBe(false);
  });

  it('rejects a single-keyword text (below threshold)', () => {
    const text = 'See you in court tomorrow! It will be fun. Bring snacks.';
    expect(isLegalDocument(text)).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isLegalDocument('')).toBe(false);
  });

  it('rejects very short text', () => {
    expect(isLegalDocument('agreement contract')).toBe(false); // < 20 chars
  });
});
```

### Step 7: Add an integration test for non-legal document upload

In `legal-mobile/backend/tests/chat.endpoint.test.ts`, add inside the existing `describe('POST /api/chat', ...)` block:

```typescript
  it('non-legal document upload returns REFUSAL_NOT_A_LEGAL_DOCUMENT', async () => {
    const app = buildApp();
    const r = await request(app)
      .post('/api/chat')
      .send({
        message: 'what does this say?',
        conversation_history: [],
        document_context: 'John Doe\nSoftware Engineer\nExperience: 5 years at TechCorp building React applications. Skilled in JavaScript and Node.js.',
        document_name: 'resume.pdf',
      });

    expect(r.status).toBe(200);
    expect(r.body.status).toBe('refused');
    expect(r.body.refusal_reason).toBe('not_a_legal_document');
    expect(r.body.response).toContain('legal document');
  });
```

NOTE: this test will need `llmService.classifyQuery` mock to return `intent: 'document_analysis'` instead of the default `legal_query` — adjust the mock at the top of the file OR add a `beforeEach`/per-test override:
```typescript
import { llmService } from '../src/services/llm.js';
// inside the test:
vi.mocked(llmService.classifyQuery).mockResolvedValueOnce({ intent: 'document_analysis', needs_rag: false, confidence: 0.9 });
```

### Step 8: Run the full test suite

From `legal-mobile/backend/`:
```
npx tsc --noEmit
npm test
```
Expected: type-check clean, all tests pass (68 prior + ~13 new = ~81).

### Step 9: Save & verify

Repository is git-tracked. After tests pass, commit and push will happen at the controller level — the implementer subagent should NOT commit or push.

---

## Self-review checklist

- `checkScope`'s default branch returns `inScope: false`.
- General legal vocabulary added so questions like "Can I sue my employer?" pass.
- `isLegalDocument` is pure, takes 800-char head, requires 2 distinct keyword matches.
- `REFUSAL_NOT_A_LEGAL_DOCUMENT` is a single export constant.
- `RefusalReason` union now includes `'not_a_legal_document'`.
- `chat.ts` calls `isLegalDocument` BEFORE building the document_analysis prompt.
- All 81+ tests pass; coverage on guardrails.ts stays ≥ 90%.
