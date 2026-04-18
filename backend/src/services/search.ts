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
      url: 'https://pakistancode.gov.pk',
      citation_number: i + 1,
    }));
  },
};
