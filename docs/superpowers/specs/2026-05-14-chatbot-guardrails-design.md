# LegalEase Mobile Chatbot — Scope, Clarity, and Guardrails Redesign

**Date:** 2026-05-14
**Status:** Draft for review
**Target stack:** TypeScript + Express backend (`legal-mobile/backend/`) and React Native + Expo frontend (`legal-mobile/src/`).
**Reviewer feedback being addressed (verbatim):**
> *"Add on some limitations so your chatbot fulfill the need of user. Improve the response so it is easy for user to understand the response and also implement guardrails. have a look into your chatbot approach and guardrails. Need to more specific with your problem."*

---

## 1. Problem statement (narrowed)

**Before (too broad):** *"AI legal assistant for Pakistani law."*

**After (specific):**

> *LegalEase is a first-pass legal information assistant for non-lawyer Pakistani citizens. It explains laws and procedures in seven domains — Criminal, Civil, Family, Police, Land & Property, Religious, Banking & Financial, and the 1973 Constitution — in plain English with key Urdu terms. It is designed to help a citizen (a) understand what the law says, (b) know what next step to take (police, court, lawyer, ombudsman), and (c) locate the official source on pakistancode.gov.pk. It does not draft court filings, give jurisdiction-specific advice for non-Pakistani law, opine on guilt/innocence, or replace a qualified lawyer.*

This statement is the single source of truth and is referenced from:

- The `LEGALEASE_SCOPE` constant in `legal-mobile/backend/src/services/guardrails.ts`.
- The empty-state banner shown on `ChatScreen.js` at first chat load.
- The system prompt prefix for every legal-advice path in `legal-mobile/backend/src/api/chat.ts`.

## 2. Goals and non-goals

### Goals

- G1. Refuse out-of-scope, dangerous, and prompt-injection queries deterministically (not via prompt instruction alone).
- G2. Make every legal answer follow a fixed, plain-language Markdown structure that the existing `MarkdownText.js` renderer can display nicely (headings, bullets, numbered lists, blockquotes, links).
- G3. Pakistan Code links surfaced by the AI in its answer text remain tappable on iOS/Android (already wired by `MarkdownText.js` after the prior link-rendering port).
- G4. Every guardrail is independently unit-testable with `vitest`.

### Non-goals

- N1. No external moderation API. Keep guardrails in-process for offline reliability and zero added latency.
- N2. No model swap. Continue with whatever Groq model `llmService` currently uses.
- N3. No changes to `dataService` or law data files.
- N4. No changes to the contract-analysis, lawyer, education, auth, document, or transcribe routers.
- N5. No multilingual translation engine — Urdu terms appear inline alongside English (`theft (چوری)`).

## 3. Architecture

### 3.1 New module: `legal-mobile/backend/src/services/guardrails.ts`

A single TypeScript file with four pure functions plus two readonly interfaces. Zero I/O, no LLM call, no `dataService` access — purely deterministic.

```text
guardrails.ts
├─ ScopeVerdict (interface, readonly fields)
├─ ValidationResult (interface, readonly fields)
├─ checkScope(query: string): ScopeVerdict
├─ detectInjection(query: string): boolean
├─ redactPii(text: string): string
└─ validateAnswer(answer: string, sources: SourceInfo[]): ValidationResult
```

### 3.2 Wiring in `legal-mobile/backend/src/api/chat.ts`

```text
POST /api/chat
 │
 ├─ Step A:  redactPii(message)              → safeMessageForLogging
 ├─ Step B:  detectInjection(message)        → if true, return refusal payload (REFUSAL_INJECTION)
 ├─ Step C:  checkScope(message)
 │            ├─ verdict.category === "dangerous"    → return REFUSAL_DANGEROUS
 │            └─ !verdict.inScope                    → return REFUSAL_OUT_OF_SCOPE (with matchedSignal)
 ├─ Step D:  (existing) llmService.classifyQuery + searchService.searchLegalContext
 ├─ Step E:  (existing) llmService.generateResponse, but with the new structured prompt
 ├─ Step F:  validateAnswer(response, sources)
 │            ├─ reason === "hallucinated_citation"  → REFUSAL_ZERO_EVIDENCE
 │            ├─ reason === "bad_shape"              → REFUSAL_GENERATION_FAILED
 │            ├─ reason === "too_short" | "too_long" → REFUSAL_GENERATION_FAILED
 │            └─ fixedAnswer set                     → use fixed answer (auto-repaired disclaimer)
 └─ return ChatResponse (with optional refusal_reason field)
```

Only the `POST /` handler in `chat.ts` changes. The contract, lawyers, education, auth, document, and transcribe routers are untouched.

### 3.3 New constants

All scope / template / refusal text lives in `guardrails.ts` and is re-exported from there:

- `LEGALEASE_SCOPE` — the narrowed problem statement above, injected into every legal-advice prompt.
- `RESPONSE_TEMPLATE_INSTRUCTION` — the fixed Markdown skeleton.
- `REFUSAL_INJECTION`, `REFUSAL_OUT_OF_SCOPE`, `REFUSAL_DANGEROUS`, `REFUSAL_ZERO_EVIDENCE`, `REFUSAL_GENERATION_FAILED` — the five canned responses.

### 3.4 `ChatResponse` extension

`legal-mobile/backend/src/types/index.ts` adds one optional field to the existing `ChatResponse` interface:

```typescript
export interface ChatResponse {
  response: string;
  sources: SourceInfo[];
  collections_used: string[];
  status: string;
  refusal_reason?: 'injection' | 'out_of_scope' | 'dangerous' | 'zero_evidence' | 'generation_failed';
}
```

## 4. Component specs

### 4.1 `checkScope(query) -> ScopeVerdict`

A small rule-based classifier. Not an LLM call.

```typescript
export interface ScopeVerdict {
  readonly inScope: boolean;
  readonly category: 'legal_pk' | 'out_of_scope' | 'dangerous';
  readonly matchedSignal: string;
}
```

Rule order (first match wins):

1. **Dangerous patterns** — illegal-instruction regex (bribe, forge, launder, evade tax, fake CNIC, smuggle, hack/break into, kill/harm). Returns `category: 'dangerous'`.
2. **Pakistani-law signal** — substring match against `PK_LAW_SIGNALS` (criminal, civil, family, divorce, nikah, khula, talaq, property, land, tenant, banking, loan, police, FIR, constitution, fundamental right, religious, sharia, islamic law, inheritance, pakistan, pakistani, sindh, punjab, balochistan, khyber pakhtunkhwa, islamabad, PPC, CrPC, contract act, transfer of property act, muslim family laws ordinance). Returns `category: 'legal_pk'`.
3. **Urdu script** — any character in the Arabic/Urdu Unicode block (U+0600–U+06FF) → `category: 'legal_pk'`, matchedSignal = `'urdu_script'`.
4. **Out-of-scope patterns** — non-legal keywords (weather, recipe, cricket, football, movie, song, python, javascript, homework, math, phone, laptop, stock price, bitcoin) and foreign-jurisdiction phrases (`\bus tax\b`, `\bus law\b`, `\buk law\b`, `\buk divorce\b`, `\bindian penal code\b`, `\bsaudi\b`, `\bdubai\b`, `in the united states`, `in the united kingdom`, `in india`). Returns `category: 'out_of_scope'`.
5. **Default allow** — `inScope: true, category: 'legal_pk', matchedSignal: 'default_allow'`. We err toward letting the LLM try; `validateAnswer` catches hallucinations downstream.

Empty/whitespace query → `inScope: false, category: 'out_of_scope', matchedSignal: 'empty_query'`.

### 4.2 `detectInjection(query) -> boolean`

Returns `true` when any of:

- Substring (case-insensitive) match against `INJECTION_PHRASES`:
  `ignore previous`, `ignore the above`, `ignore above`, `disregard your instructions`, `disregard the above`, `new instructions:`, `you are now`, `pretend to be`, `developer mode`, `jailbreak`, `reveal your prompt`, `reveal your system prompt`, `print your prompt`, `print your system prompt`, `print your instructions`.
- Substring match against `INJECTION_TOKENS`:
  `</system>`, `<|im_start|>`, `<|im_end|>`, `<|system|>`, `<|user|>`, `<|assistant|>`.
- Role-impersonation regex `^\s*(system|assistant|user said)\s*[:\-]` (multiline, case-insensitive).
- Any whitespace-free token longer than 200 chars (likely encoded payload).

False positives are acceptable; false negatives are not.

### 4.3 `redactPii(text) -> string`

Used **for logging only**. The user's original query still goes to the LLM unchanged.

Patterns replaced:

- **CNIC:** `\b\d{5}-\d{7}-\d\b` → `[REDACTED_CNIC]`
- **Pakistani mobile:** `(\+92[\s-]?|0)3\d{2}[\s-]?\d{7}\b` → `[REDACTED_PHONE]`
- **Email:** standard email regex → `[REDACTED_EMAIL]`
- **IBAN (Pakistan):** `\bPK\d{2}[A-Z0-9]{20}\b` → `[REDACTED_ACCOUNT]`

The `console.log(\`Chat request: …\`)` call in `chat.ts` is updated to pipe `message` through `redactPii` before printing.

### 4.4 `validateAnswer(answer, sources) -> ValidationResult`

```typescript
export interface ValidationResult {
  readonly valid: boolean;
  readonly reason: 'ok' | 'bad_shape' | 'hallucinated_citation' | 'too_short' | 'too_long' | 'disclaimer_appended';
  readonly fixedAnswer: string | null;
}
```

Checks, in order:

1. **Length sanity.** `< 80` chars → `too_short`. `> 3000` chars → `too_long`.
2. **Shape check.** Answer must contain all three required headers: `**Quick answer:**`, `**What the law says:**`, `**What you can do next:**`. Missing any → `bad_shape`.
3. **Hallucination check.** Answer mentions a statute pattern (`/\b(section|article|ordinance|act)\s+\d+/i`) AND `sources.length === 0` → `hallucinated_citation`.
4. **Disclaimer auto-repair.** If shape passes but the disclaimer line is missing (`"not legal advice"` substring), append it and return `valid: true, reason: 'disclaimer_appended', fixedAnswer`.

On `bad_shape`, the `/chat` handler returns `REFUSAL_GENERATION_FAILED` immediately (no LLM retry in the MVP; this can be added later without changing the function signature).

## 5. Response template

Every legal-advice answer must conform to this Markdown skeleton — designed to look good in the existing `MarkdownText.js` renderer (which now supports bold, italic, code, bullets, numbered lists, blockquotes, and clickable `[text](url)` links):

```markdown
**Quick answer:** <one plain-English sentence, no jargon>

**What the law says:**
- <bullet 1, jargon-free>
- <bullet 2, with Urdu term in parentheses on first technical word>
- <bullet 3>

**Relevant law:** [<Act name>](<pakistancode.gov.pk URL>)
*<one-line layperson summary of why this Act applies>*

**What you can do next:**
1. <concrete action>
2. <concrete action>
3. <when to escalate to a lawyer or specific authority>

> ⚠️ **Important:** This is general legal information, not legal advice. For your specific situation, consult a qualified Pakistani lawyer or your local Bar Council.
```

Rules baked into the prompt:

- Plain English aimed at a non-lawyer.
- First time a legal term appears, gloss it in Urdu in parentheses: `theft (چوری)`, `injunction (حکم امتناعی)`, `divorce (طلاق)`.
- Use the existing `LAW_REFERENCE_LINKS` URL list (already exported from `search.ts`) for the `**Relevant law:**` link.
- "What you can do next" must contain at least one concrete action verb (file, visit, contact, request, apply).
- Never use "I think" or "in my opinion".

## 6. Refusal templates

All five are plain Markdown strings (no LLM call), returned in the `response` field of `ChatResponse` with `sources: []`, `collections_used: []`, `status: 'refused'`, and `refusal_reason` set to the matching enum value.

### `REFUSAL_INJECTION`

> I noticed something unusual in your message that looks like an attempt to change how I work. I'm only able to help with Pakistani legal questions — please rephrase your question in plain language and I'll do my best.

### `REFUSAL_OUT_OF_SCOPE`

> LegalEase only covers Pakistani law in seven areas: Criminal, Civil, Family, Police, Land & Property, Religious, Banking & Financial, and the 1973 Constitution.
>
> Your question looks like it's about **{matchedSignal}**, which is outside what I can help with. If you'd like Pakistani-law guidance on a related issue, rephrase your question and I'll try again.

`{matchedSignal}` is interpolated from `ScopeVerdict.matchedSignal`.

### `REFUSAL_DANGEROUS`

> I can't help with that. If you have a legitimate concern related to your situation — for example, you've been asked to pay a bribe, or you're worried about fraud — here's where to report it:
>
> - **National Accountability Bureau (NAB)** — corruption reports
> - **Federal Investigation Agency (FIA)** — financial / cyber crime
> - **Your local police station** — file an FIR
> - **Pakistan Citizen's Portal (PCP)** — general grievances

### `REFUSAL_ZERO_EVIDENCE`

> I don't have a reliable Pakistani statutory reference for this question in my database, so I won't guess. Please:
>
> 1. Re-check whether your question is about one of the seven covered areas above, OR
> 2. Consult a Pakistani lawyer (your district Bar Council can refer you), OR
> 3. Search the official Pakistan Code at [pakistancode.gov.pk](https://pakistancode.gov.pk/english/).

### `REFUSAL_GENERATION_FAILED`

> I tried to answer your question but couldn't produce a response in the right format. Please rephrase your question more simply (one issue at a time), or try again in a moment.

## 7. Frontend changes (React Native)

Two surgical changes to `legal-mobile/src/`:

### 7.1 Empty-state banner — `ChatScreen.js`

Replace the existing empty-state copy with a card showing the narrowed problem statement and 8 domain chips. The current empty state already lives in `ChatScreen.js`; we change its text and add a chips row. No new components introduced — the chips reuse the existing `colors` and `spacing` tokens from `constants/theme`.

### 7.2 Refusal bubble styling — `ChatMessage.js`

`ChatMessage` already has an `isError` flag and `aiBubbleError` style for error bubbles. We add a parallel `isRefusal` flag and `aiBubbleRefusal` style (amber/yellow tint instead of red) so refusals are visually distinct from regular answers and errors. The `services/api.js` layer maps the new `refusal_reason` field from the response body into a `isRefusal: true` property on the message object.

No changes to `CitationCard.js`, `MarkdownText.js` (already updated for link rendering), the markdown renderer, `InputBar`, or the suggestion cards.

## 8. Testing strategy

A new `legal-mobile/backend/tests/` directory using `vitest` (chosen because it works out of the box with the project's TypeScript ESM setup; no `ts-jest` configuration needed). Coverage target: 90%+ for `guardrails.ts`.

### 8.1 Unit tests — `tests/guardrails.test.ts`

- `checkScope`: 27 cases — 8 in-scope (one per domain), 6 out-of-scope non-legal, 2 foreign-jurisdiction, 5 dangerous, 5 Urdu-only, 1 default-allow.
- `detectInjection`: 16 cases — 10 known injection phrasings, 5 benign legal queries with overlapping words, 1 long-token-blob.
- `redactPii`: 11 cases — every pattern plus a combined case.
- `validateAnswer`: 10 cases — well-formed, missing each of the three headers, hallucinated citation, no-citation-no-sources OK, too short, too long, disclaimer auto-repair.

### 8.2 Integration tests — `tests/chat.endpoint.test.ts`

Three end-to-end tests with `supertest` + `vitest` (`vi.mock` for `llmService` and `searchService`):

1. In-scope query → 200, response body contains all three template headers.
2. Injection query → 200, `status: 'refused'`, `refusal_reason: 'injection'`, `sources: []`.
3. Out-of-scope query → 200, `status: 'refused'`, `refusal_reason: 'out_of_scope'`, message interpolates the matched signal.

### 8.3 Demo script — `docs/superpowers/demo-script.md`

10 queries to run live during the project defense, with expected behavior per query, so the reviewer sees every guard fire on stage.

## 9. Migration / rollout

Each step is independently revertable. No DB migration, no schema change.

1. Land `guardrails.ts` + vitest tests (dead code at this point).
2. Add `refusal_reason` field to `ChatResponse` interface and update consumers.
3. Wire pre-filters (`detectInjection`, `checkScope`) into `chat.ts`. Smoke-test.
4. Wire `validateAnswer` and the structured response template into the three legal-advice prompts. Smoke-test.
5. Frontend banner + refusal styling.
6. Update `README.md` (or create one) and ship the demo script.

## 10. Open risks

| Risk | Mitigation |
|---|---|
| `checkScope` too aggressive — refuses real legal queries in casual phrasing | Default-allow branch + log every refusal with `matchedSignal` for offline review |
| LLM stops following the response template | `validateAnswer` catches shape failures and returns `REFUSAL_GENERATION_FAILED`; integration test asserts shape |
| Urdu-term glossing wrong | Bake a 30-term `URDU_GLOSSARY` into the prompt for the highest-frequency legal terms; everything else, LLM uses its own translation (acceptable for v1) |
| `tsx`/ESM + vitest tooling conflict | Use vitest's built-in ESM support, configured via `vitest.config.ts` in the backend folder |

## 11. Out of scope for this iteration

- Multi-turn memory consistency checks.
- Voice-input safety (the app supports speech-to-text — same guardrails will apply unmodified).
- Lawyer-handoff workflow from a refusal.
- Telemetry dashboard for refusal rates over time.

## 12. Success criteria

1. Every reviewer bullet has a corresponding component (§1 specific problem, §4 guardrails, §4.4 + §5 easy to understand, §3.1 + §4.1 limitations).
2. `npm test` in `legal-mobile/backend/` runs all guardrail + integration tests, ≥90% line coverage on `guardrails.ts`.
3. The 10-query demo script runs end-to-end without any guard mis-firing.
4. The empty-state banner on `ChatScreen.js` renders the narrowed problem statement and 8 domain chips on iOS, Android, and web.
5. The chatbot's first response to any in-scope question contains the disclaimer line at least once.

---

*End of spec.*
