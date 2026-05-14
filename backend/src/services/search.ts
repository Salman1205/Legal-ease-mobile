import { dataService } from './data.js';

export interface SearchResult {
  law: string;
  title: string;
  section: string;
  text: string;
  relevance: number;
  citation: string;
  category: string;
}

const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);

const overlapScore = (queryTokens: string[], haystack: string): number => {
  const lower = haystack.toLowerCase();
  const matches = queryTokens.filter((t) => lower.includes(t)).length;
  if (queryTokens.length === 0) return 0;
  return matches / queryTokens.length;
};

const categoryHints: Record<string, string[]> = {
  family: ['family', 'custody', 'child', 'marriage', 'divorce', 'khula', 'inheritance'],
  banking: ['bank', 'banking', 'loan', 'finance', 'debt', 'cheque'],
  property: ['property', 'land', 'tenant', 'rent', 'lease', 'real', 'estate'],
  police: ['police', 'fir', 'arrest', 'bail', 'investigation', 'criminal'],
  religious: ['religion', 'religious', 'sharia', 'muslim', 'christian', 'hindu'],
};

const detectPreferredCategories = (queryLower: string): string[] =>
  Object.entries(categoryHints)
    .filter(([, hints]) => hints.some((hint) => queryLower.includes(hint)))
    .map(([category]) => category);

export const searchService = {
  async searchLegalContext(query: string, limit: number = 10): Promise<SearchResult[]> {
    const queryTokens = tokenize(query);
    const queryLower = query.toLowerCase();
    const lawSections = dataService.getLawSections();

    const ranked = lawSections
      .map((section) => {
        const sectionPath = Array.isArray(section.section_path) ? section.section_path.join(' > ') : 'Section';
        const titleScore = overlapScore(queryTokens, section.title) * 0.4;
        const contentScore = overlapScore(queryTokens, section.content) * 0.5;
        const lawScore = overlapScore(queryTokens, section.law_name) * 0.1;
        const relevance = titleScore + contentScore + lawScore;

        return {
          law: section.law_name,
          title: section.title,
          section: sectionPath,
          text: section.content,
          relevance,
          citation: `${section.law_name}, ${sectionPath}`,
          category: section.category,
        } satisfies SearchResult;
      })
      .sort((a, b) => b.relevance - a.relevance);

    const relevant = ranked.filter((item) => item.relevance > 0).slice(0, limit);
    if (relevant.length > 0) {
      return relevant;
    }

    const preferredCategories = detectPreferredCategories(queryLower);
    if (preferredCategories.length > 0) {
      const categoryFallback = ranked
        .filter((item) => preferredCategories.some((category) => item.category.toLowerCase().includes(category)))
        .slice(0, limit);
      if (categoryFallback.length > 0) {
        return categoryFallback;
      }
    }

    // As a final fallback, return top legal sections so users still get grounded references.
    return ranked.slice(0, limit);
  },

  // Format search results for response
  formatResults(results: SearchResult[]): any[] {
    return results.map((r, i) => ({
      law: r.law,
      title: r.title,
      section: r.section,
      relevance: `${(r.relevance * 100).toFixed(1)}%`,
      citation: r.citation,
      text: r.text.substring(0, 240) + (r.text.length > 240 ? '...' : ''),
      category: r.category,
      url: pakistanCodeUrlForCategory(r.category),
      citation_number: i + 1,
    }));
  },
};

// ----------------------------------------------------------------------------
// Pakistan Code category → official URL
// Source: BibTeX references collected from pakistancode.gov.pk.
// Used to populate `SourceInfo.url` so the mobile CitationCard "View" button
// deep-links to the correct catid page.
// ----------------------------------------------------------------------------
const PAKISTAN_CODE_BASE = 'https://pakistancode.gov.pk/english';

const PAKISTAN_CODE_URLS: Record<string, string> = {
  criminal: `${PAKISTAN_CODE_BASE}/LGu0xVD-apaUY2Fqa-ag%3D%3D&action=primary&catid=1`,
  civil: `${PAKISTAN_CODE_BASE}/LGu0xVD-apaUY2Fqa-aw%3D%3D&action=primary&catid=2`,
  family: `${PAKISTAN_CODE_BASE}/LGu0xVD-apaUY2Fqa-bA%3D%3D&action=primary&catid=3`,
  police: `${PAKISTAN_CODE_BASE}/LGu0xVD-apaUY2Fqa-bw%3D%3D&action=primary&catid=6`,
  property: `${PAKISTAN_CODE_BASE}/LGu0xVD-apaUY2Fqa-cQ%3D%3D&action=primary&catid=8`,
  religious: `${PAKISTAN_CODE_BASE}/LGu0xVD-apaUY2Fqa-cg%3D%3D&action=primary&catid=9`,
  banking: `${PAKISTAN_CODE_BASE}/LGu0xVD-apaUY2Fqa-apY%3D&action=primary&catid=10`,
  constitution: `${PAKISTAN_CODE_BASE}/UY2FqaJw1-apaUY2Fqa-apaUY2Fvbpw%3D-sg-jjjjjjjjjjjjj`,
};

const pakistanCodeUrlForCategory = (category: string): string => {
  if (!category) return `${PAKISTAN_CODE_BASE}/`;
  const lower = category.toLowerCase();
  for (const [key, url] of Object.entries(PAKISTAN_CODE_URLS)) {
    if (lower.includes(key)) return url;
  }
  return `${PAKISTAN_CODE_BASE}/`;
};

export const LAW_REFERENCE_LINKS = `
AVAILABLE SOURCE LINKS (Pakistan Code, https://pakistancode.gov.pk):
- The Constitution of the Islamic Republic of Pakistan (1973) → ${PAKISTAN_CODE_URLS.constitution}
- Criminal Laws of Pakistan → ${PAKISTAN_CODE_URLS.criminal}
- Civil Laws of Pakistan → ${PAKISTAN_CODE_URLS.civil}
- Family Laws of Pakistan → ${PAKISTAN_CODE_URLS.family}
- Police Laws of Pakistan → ${PAKISTAN_CODE_URLS.police}
- Land and Property Laws of Pakistan → ${PAKISTAN_CODE_URLS.property}
- Islamic and Religious Laws of Pakistan → ${PAKISTAN_CODE_URLS.religious}
- Banking and Financial Laws of Pakistan → ${PAKISTAN_CODE_URLS.banking}

LINKING GUIDANCE (do NOT change how you normally cite laws):
- Cite specific statutes, ordinances, and sections exactly as you already would.
- If a statute you cite belongs to one of the categories above (e.g. the Pakistan
  Penal Code belongs to Criminal Laws; the Muslim Family Laws Ordinance belongs
  to Family Laws), attach the matching category URL as a markdown link the FIRST
  time that category is mentioned in your answer.
  Example: "Section 378 of the Pakistan Penal Code 1860 ([Criminal Laws of Pakistan](${PAKISTAN_CODE_URLS.criminal})) defines theft as..."
- If a law you cite has NO matching category above, cite it plainly with no link.
  Do not invent URLs and do not link to other domains.
- Only the law-category names above should be hyperlinked; do not wrap unrelated
  words or generic phrases.
`;
