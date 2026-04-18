import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

interface LawSection {
  law_name: string;
  title: string;
  source: string;
  content: string;
  section_path?: string[];
  metadata?: Record<string, unknown>;
  category: string;
}

interface DatasetCache {
  lawSections: LawSection[];
  lawyers: Record<string, any>;
  lawyerReviews: Record<string, any>;
  courses: Record<string, any>;
  eduCourses: Record<string, any>;
  eduLibrary: Record<string, any>;
  lawLibrary: Record<string, any>;
  eduProgress: Record<string, any>;
  eduAssessments: Record<string, any>;
  users: Record<string, any>;
  sessions: Record<string, any>;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR_CANDIDATES = [
  path.resolve(__dirname, '../data'),
  path.resolve(__dirname, '../../data'),
  path.resolve(process.cwd(), 'data'),
  path.resolve(process.cwd(), 'backend/data'),
];

const IS_READ_ONLY_FS = !!process.env.VERCEL || process.env.NODE_ENV === 'vercel';

const resolveDataDir = (): string => {
  for (const dir of DATA_DIR_CANDIDATES) {
    if (fs.existsSync(dir)) return dir;
  }
  return DATA_DIR_CANDIDATES[0];
};

const resolveDataPath = (filename: string): string | null => {
  for (const dir of DATA_DIR_CANDIDATES) {
    const candidate = path.join(dir, filename);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
};

const LAW_SOURCES = [
  { file: 'Essential_laws.json', category: 'Essential Law' },
  { file: 'Banking_Laws.json', category: 'Banking Law' },
  { file: 'family_laws.json', category: 'Family Law' },
  { file: 'Land-Property_Law.json', category: 'Property Law' },
  { file: 'Police_Laws.json', category: 'Police Law' },
  { file: 'Religious_Laws.json', category: 'Religious Law' },
];

const readJsonFile = <T>(filename: string, fallback: T): T => {
  try {
    const filePath = resolveDataPath(filename);
    if (!filePath) return fallback;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Failed to read ${filename}:`, error);
    return fallback;
  }
};

const writeJsonFile = (filename: string, data: unknown): void => {
  if (IS_READ_ONLY_FS) return;
  try {
    const dir = resolveDataDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Failed to write ${filename}:`, error);
  }
};

const normalizeLawSections = (): LawSection[] => {
  const sections: LawSection[] = [];

  LAW_SOURCES.forEach((sourceInfo) => {
    const data = readJsonFile<any[]>(sourceInfo.file, []);
    if (!Array.isArray(data) || data.length === 0) return;

    const first = data[0];
    if (first && Array.isArray(first.sections)) {
      data.forEach((law) => {
        const lawName = law?.law_name || law?.title || 'Unknown Law';
        const lawSections = Array.isArray(law?.sections) ? law.sections : [];
        lawSections.forEach((section: any) => {
          sections.push({
            law_name: lawName,
            title: section?.title || 'Untitled Section',
            source: section?.source || lawName,
            content: section?.content || '',
            section_path: section?.section_path,
            metadata: section?.metadata,
            category: sourceInfo.category,
          });
        });
      });
    } else {
      data.forEach((flat: any) => {
        sections.push({
          law_name: flat?.source || flat?.law_name || 'Unknown Law',
          title: flat?.title || 'Untitled Section',
          source: flat?.source || flat?.law_name || 'Unknown Law',
          content: flat?.content || '',
          section_path: flat?.section_path,
          metadata: flat?.metadata,
          category: sourceInfo.category,
        });
      });
    }
  });

  return sections;
};

let cachedData: DatasetCache | null = null;

export const dataService = {
  loadAll: (): DatasetCache => {
    if (cachedData) return cachedData;

    cachedData = {
      lawSections: normalizeLawSections(),
      lawyers: readJsonFile<Record<string, any>>('lawyers_db.json', {}),
      lawyerReviews: readJsonFile<Record<string, any>>('lawyer_reviews_db.json', {}),
      courses: readJsonFile<Record<string, any>>('courses_db.json', {}),
      eduCourses: readJsonFile<Record<string, any>>('edu_courses_db.json', {}),
      eduLibrary: readJsonFile<Record<string, any>>('edu_library_db.json', {}),
      lawLibrary: readJsonFile<Record<string, any>>('law_library_db.json', {}),
      eduProgress: readJsonFile<Record<string, any>>('edu_progress_db.json', {}),
      eduAssessments: readJsonFile<Record<string, any>>('edu_assessments_db.json', {}),
      users: readJsonFile<Record<string, any>>('users_db.json', {}),
      sessions: readJsonFile<Record<string, any>>('sessions_db.json', {}),
    };

    console.log(
      `Loaded datasets: laws=${cachedData.lawSections.length}, lawyers=${Object.keys(cachedData.lawyers).length}, courses=${Object.keys(cachedData.courses).length}, eduCourses=${Object.keys(cachedData.eduCourses).length}, assessments=${Object.keys(cachedData.eduAssessments).length}`
    );

    return cachedData;
  },

  refresh: (): DatasetCache => {
    cachedData = null;
    return dataService.loadAll();
  },

  // Writers — persist to disk in dev, no-op on serverless read-only filesystems
  saveLawyers: (): void => writeJsonFile('lawyers_db.json', dataService.loadAll().lawyers),
  saveLawyerReviews: (): void =>
    writeJsonFile('lawyer_reviews_db.json', dataService.loadAll().lawyerReviews),
  saveEduCourses: (): void => writeJsonFile('edu_courses_db.json', dataService.loadAll().eduCourses),
  saveEduProgress: (): void =>
    writeJsonFile('edu_progress_db.json', dataService.loadAll().eduProgress),
  saveEduAssessments: (): void =>
    writeJsonFile('edu_assessments_db.json', dataService.loadAll().eduAssessments),
  saveEduLibrary: (): void => writeJsonFile('edu_library_db.json', dataService.loadAll().eduLibrary),
  saveUsers: (): void => writeJsonFile('users_db.json', dataService.loadAll().users),
  saveSessions: (): void => writeJsonFile('sessions_db.json', dataService.loadAll().sessions),

  getLawSections: (): LawSection[] => dataService.loadAll().lawSections,
  getLawyers: (): Record<string, any> => dataService.loadAll().lawyers,
  getLawyerReviews: (): Record<string, any> => dataService.loadAll().lawyerReviews,
  getCourses: (): Record<string, any> => dataService.loadAll().courses,
  getEduCourses: (): Record<string, any> => dataService.loadAll().eduCourses,
  getEduLibrary: (): Record<string, any> => dataService.loadAll().eduLibrary,
  getLawLibrary: (): Record<string, any> => dataService.loadAll().lawLibrary,
  getEduProgress: (): Record<string, any> => dataService.loadAll().eduProgress,
  getEduAssessments: (): Record<string, any> => dataService.loadAll().eduAssessments,
  getUsers: (): Record<string, any> => dataService.loadAll().users,
  getSessions: (): Record<string, any> => dataService.loadAll().sessions,
};
