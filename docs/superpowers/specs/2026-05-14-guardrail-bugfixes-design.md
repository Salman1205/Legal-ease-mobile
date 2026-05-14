# Guardrail Bug Fixes — Default-Deny Scope + Document-Type Guard

**Date:** 2026-05-14
**Status:** Approved
**Builds on:** `2026-05-14-chatbot-guardrails-design.md`

## Reported bugs

1. **Bug 1 — "Reverse a linked list" was answered.** The query contained no Pakistani-law signal and no out-of-scope pattern keyword, so it hit `checkScope`'s `default_allow` branch and was forwarded to the LLM, which produced a programming answer.
2. **Bug 2 — A user's resume was analyzed as a contract.** The `document_analysis` branch in `chat.ts` does not classify or constrain the uploaded document; the LLM treated the resume as a contract because the prompt only said "carefully analyze the document content".

## Root causes

- **Bug 1 root cause:** `checkScope`'s final branch returns `inScope: true, matchedSignal: 'default_allow'`. This is a default-allow policy on a narrow-domain assistant — the opposite of what a guardrail should do. The code-quality reviewer flagged this exact concern during Task 2 of the original guardrails plan; it was dismissed as a minor concern. The bug is the predictable consequence.
- **Bug 2 root cause:** The `document_analysis` branch in `chat.ts` accepts any uploaded document text and asks the LLM to "carefully analyze" it. No guardrail inspects the document itself; only the user's *message* goes through `checkScope`. Non-legal documents (resume, recipe, code) reach the LLM and get analyzed as if they were legal.

## Fix overview

### Fix A — Flip `checkScope` to default-deny + expand legal-vocabulary allowlist

1. Replace the `default_allow` final-branch return with `{ inScope: false, category: 'out_of_scope', matchedSignal: 'no_legal_signal_detected' }`.
2. Expand `PK_LAW_SIGNALS` (or the domain-grouped equivalent the implementer used) with general legal-English terms so legitimate legal questions phrased without explicit Pakistan-specific words still pass: `court, lawyer, judge, rights, sentence, fine, sue, lawsuit, eviction, custody, alimony, arrest, bail, contract, will, inheritance, ordinance, statute, jurisdiction, plaintiff, defendant, hearing, appeal, magistrate, advocate, legal`.

### Fix D — Document-content scope check + prompt tightening

1. New pure function in `guardrails.ts`:
   ```typescript
   export const isLegalDocument = (documentText: string): boolean
   ```
   Scans the first 800 chars (case-insensitive) for legal-document keywords: `agreement, contract, party, parties, hereby, witnesseth, fir, notice, plaintiff, defendant, court, ordinance, section, clause, undersigned, jurisdiction, governing law, lessor, lessee, landlord, tenant, deed, summons, petition, writ, complaint, judgment, decree, magistrate`. Returns `true` if **at least 2** distinct keywords match (the 2-match threshold avoids false positives on a resume that happens to contain the word "court" once in "tennis court").
2. New refusal constant `REFUSAL_NOT_A_LEGAL_DOCUMENT`:
   > "I can only analyze legal documents (contracts, FIRs, court notices, legal notices, ordinances, etc.). The document you uploaded does not look like a legal document. If this is meant to be a legal document, make sure the file you uploaded is correct and try again."
3. In `chat.ts`'s `document_analysis` branch (before building the system prompt), call `isLegalDocument(document_context)`. If `false`, return `refusalResponse(REFUSAL_NOT_A_LEGAL_DOCUMENT, 'not_a_legal_document')`.
4. Add `'not_a_legal_document'` to the `RefusalReason` union in `types/index.ts`.
5. Tighten the `document_analysis` prompt: prepend an instruction to state the document type in the first line of the response ("This appears to be a *contract / FIR / notice / etc.*") so misclassifications are visible to the user.

## Files touched

| Path | Change |
|---|---|
| `legal-mobile/backend/src/services/guardrails.ts` | Flip `checkScope` default to `out_of_scope`; expand legal-vocabulary; add `isLegalDocument`; add `REFUSAL_NOT_A_LEGAL_DOCUMENT` constant |
| `legal-mobile/backend/src/types/index.ts` | Add `'not_a_legal_document'` to `RefusalReason` |
| `legal-mobile/backend/src/api/chat.ts` | Call `isLegalDocument` in the `document_analysis` branch; tighten the document_analysis system prompt |
| `legal-mobile/backend/tests/guardrails.test.ts` | Add ~5 new `checkScope` tests (programming/general non-legal queries) + ~10 `isLegalDocument` tests |
| `legal-mobile/backend/tests/chat.endpoint.test.ts` | Add 1 new integration test: non-legal document upload → `refusal_reason: 'not_a_legal_document'` |

## Test cases

### `checkScope` — new
- `'How do I reverse a linked list?'` → refused (`out_of_scope`, `no_legal_signal_detected`)
- `'Explain quantum physics in simple terms'` → refused
- `'What is the capital of France?'` → refused
- `'Tell me a poem about love'` → refused
- `'Can I sue my employer for unpaid wages?'` → in-scope (matches new keyword `sue` or `lawsuit`)
- `'What are my rights as a worker?'` → in-scope (matches `rights`)
- `'Do I have grounds for an appeal?'` → in-scope (matches `appeal`)

### `isLegalDocument` — new
- Real contract text (party/agreement/hereby/clause) → `true`
- Real FIR text (FIR/complainant/section/court) → `true`
- Resume text (experience/skills/education) → `false`
- Recipe text (ingredients/preheat/oven) → `false`
- Source code (function/return/import) → `false`
- Single-keyword text ("see you in court tomorrow") → `false` (need 2 distinct matches)
- Empty string → `false`

### Integration — new
- Upload resume-like document text + ask "what does this say?" → `refusal_reason: 'not_a_legal_document'`

## Success criteria

1. `pytest`/`vitest` passes for all unit + integration tests (~84 total: 68 prior + ~16 new).
2. Demo query "reverse a linked list" is refused.
3. Demo upload of a resume is refused with the dedicated refusal message.
4. The Pakistan Code happy-path queries (theft, FIR, divorce) still produce structured answers.

## Non-goals

- LLM-based scope classifier (we considered it; deterministic + expanded keyword list is enough and defensible).
- Multi-language document detection beyond simple keyword matching.
- Document classification *type* output (we refuse non-legal; we don't try to categorize legal documents as contract-vs-FIR-vs-notice in code — the LLM still handles that distinction inside the document_analysis prompt).
