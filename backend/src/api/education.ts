import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import {
  Course,
  CoursePublic,
  CourseLesson,
  ProgressRecord,
  ProgressUpdateRequest,
  ProgressResponse,
  LawEntry,
  Assessment,
  AssessmentPublic,
  AssessmentWithQuestions,
  QuestionPublic,
  AnswerSubmitRequest,
  AnswerResult,
  AssessmentResult,
} from '../types/index.js';
import { dataService } from '../services/data.js';

export const educationRouter = Router();

const JSON_FILE_CATEGORIES = [
  'Family Law',
  'Banking Law',
  'Land & Property Law',
  'Police Law',
  'Religious Law',
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
const normaliseCourse = (raw: Record<string, any>): Course => {
  const lessons: CourseLesson[] = Array.isArray(raw.lessons)
    ? raw.lessons
    : [];

  const lessonTitles: string[] = Array.isArray(raw.lesson_titles)
    ? raw.lesson_titles
    : lessons.map((l, i) => String(l?.title || `Lesson ${i + 1}`));

  return {
    id: String(raw.id || ''),
    category: String(raw.category || raw.law_category || 'General Law'),
    title: String(raw.title || 'Untitled Course'),
    desc: String(raw.desc || raw.description || ''),
    overview: String(raw.overview || ''),
    key_topics: Array.isArray(raw.key_topics) ? raw.key_topics.map(String) : [],
    lessons,
    lesson_titles: lessonTitles,
    learning_outcomes: Array.isArray(raw.learning_outcomes)
      ? raw.learning_outcomes.map(String)
      : [],
    difficulty_notes: String(raw.difficulty_notes || ''),
    level: String(raw.level || 'Beginner'),
    hours: Number(raw.hours || raw.duration || 0),
    active: raw.active !== false,
    ai_generated: raw.ai_generated === true,
    law_name: String(raw.law_name || ''),
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
};

const getAllCourses = (): Course[] => {
  const basic = Object.values(dataService.getCourses()) as Record<string, any>[];
  const edu = Object.values(dataService.getEduCourses()) as Record<string, any>[];
  const seen = new Set<string>();
  const merged: Course[] = [];
  [...basic, ...edu].forEach((raw) => {
    const c = normaliseCourse(raw);
    if (!c.id || seen.has(c.id)) return;
    seen.add(c.id);
    merged.push(c);
  });
  return merged;
};

const getProgressForUser = (userId: string, courseId: string): ProgressRecord | undefined => {
  const all = dataService.getEduProgress();
  return (all[userId] && (all[userId] as Record<string, ProgressRecord>)[courseId]) || undefined;
};

const toPublicCourse = (course: Course, userId?: string): CoursePublic => {
  const total = course.lessons.length;
  const progress = userId ? getProgressForUser(userId, course.id) : undefined;
  const lessonsCompleted = progress?.lessons_completed || 0;
  const percent = total > 0 ? Math.round((lessonsCompleted / total) * 100) : 0;
  return {
    ...course,
    lessons_completed: lessonsCompleted,
    progress_percent: percent,
    last_lesson: progress?.last_lesson || 0,
    completed: progress?.completed || false,
  };
};

// ---------------------------------------------------------------------------
// COURSES — categories endpoint must come BEFORE /:id
// ---------------------------------------------------------------------------
educationRouter.get('/courses/categories', (_req: Request, res: Response): void => {
  const courses = getAllCourses().filter((c) => c.active !== false && c.category);
  const cats = Array.from(new Set(courses.map((c) => c.category))).sort();
  res.json(cats.length > 0 ? cats : JSON_FILE_CATEGORIES);
});

educationRouter.get('/courses', (req: Request, res: Response): void => {
  try {
    const userId = typeof req.query.user_id === 'string' ? req.query.user_id : undefined;
    const level = typeof req.query.level === 'string' ? req.query.level.toLowerCase() : undefined;
    const category = typeof req.query.category === 'string' ? req.query.category.toLowerCase() : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : undefined;

    let courses = getAllCourses().filter((c) => c.active !== false);
    if (level) courses = courses.filter((c) => c.level.toLowerCase() === level);
    if (category) courses = courses.filter((c) => c.category.toLowerCase() === category);
    if (search) {
      courses = courses.filter((c) => {
        const hay = `${c.title} ${c.desc} ${c.law_name}`.toLowerCase();
        return hay.includes(search);
      });
    }
    courses.sort((a, b) => {
      const cat = a.category.localeCompare(b.category);
      return cat !== 0 ? cat : a.title.localeCompare(b.title);
    });

    const publicCourses = courses.map((c) => toPublicCourse(c, userId));
    res.json(publicCourses);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list courses';
    res.status(500).json({ success: false, message });
  }
});

educationRouter.get('/courses/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const userId = typeof req.query.user_id === 'string' ? req.query.user_id : undefined;
    const course = getAllCourses().find((c) => c.id === id);
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }
    res.json(toPublicCourse(course, userId));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load course';
    res.status(500).json({ success: false, message });
  }
});

// ---------------------------------------------------------------------------
// PROGRESS
// ---------------------------------------------------------------------------
educationRouter.post('/progress', (req: Request, res: Response): void => {
  try {
    const body = (req.body || {}) as ProgressUpdateRequest;
    const userId = body.user_id;
    const courseId = body.course_id;
    const lessonIndex = Number(body.lesson_index);

    if (!userId || !courseId || !Number.isFinite(lessonIndex) || lessonIndex < 0) {
      res.status(400).json({ success: false, message: 'Invalid progress payload' });
      return;
    }

    const course = getAllCourses().find((c) => c.id === courseId);
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    const total = course.lessons.length;
    const progressStore = dataService.getEduProgress();
    if (!progressStore[userId]) progressStore[userId] = {};
    const userProgress = progressStore[userId] as Record<string, ProgressRecord>;

    const existing: ProgressRecord = userProgress[courseId] || {
      lessons_completed: 0,
      completed_indices: [],
      last_lesson: 0,
      completed: false,
      updated_at: new Date().toISOString(),
    };

    const indices = Array.isArray(existing.completed_indices)
      ? [...existing.completed_indices]
      : [];
    if (!indices.includes(lessonIndex)) indices.push(lessonIndex);

    const count = indices.length;
    const last = indices.length > 0 ? Math.max(...indices) : 0;
    const done = total > 0 && count >= total;
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;

    const record: ProgressRecord = {
      lessons_completed: count,
      completed_indices: indices,
      last_lesson: last,
      completed: done,
      updated_at: new Date().toISOString(),
    };
    userProgress[courseId] = record;
    dataService.saveEduProgress();

    const response: ProgressResponse = {
      user_id: userId,
      course_id: courseId,
      lessons_completed: count,
      total_lessons: total,
      progress_percent: percent,
      last_lesson: last,
      completed: done,
      updated_at: record.updated_at,
    };
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update progress';
    res.status(500).json({ success: false, message });
  }
});

educationRouter.get('/progress/:user_id', (req: Request, res: Response): void => {
  const { user_id: userId } = req.params;
  const store = dataService.getEduProgress();
  const userProgress = (store[userId] || {}) as Record<string, ProgressRecord>;
  const courses = getAllCourses();

  const result: Record<string, unknown> = {};
  Object.entries(userProgress).forEach(([courseId, prog]) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    const total = course.lessons.length;
    const count = prog.lessons_completed || 0;
    result[courseId] = {
      course_title: course.title,
      lessons_completed: count,
      total_lessons: total,
      progress_percent: total > 0 ? Math.round((count / total) * 100) : 0,
      last_lesson: prog.last_lesson || 0,
      completed: prog.completed || false,
      updated_at: prog.updated_at || '',
    };
  });
  res.json(result);
});

// ---------------------------------------------------------------------------
// LAW LIBRARY
// ---------------------------------------------------------------------------
const getLibraryEntries = (): LawEntry[] => {
  const merged = [
    ...Object.values(dataService.getEduLibrary()),
    ...Object.values(dataService.getLawLibrary()),
  ] as Record<string, any>[];
  const seen = new Set<string>();
  const out: LawEntry[] = [];
  merged.forEach((raw) => {
    const id = String(raw.id || '');
    if (!id || seen.has(id)) return;
    if (raw.active === false) return;
    seen.add(id);
    out.push({
      id,
      title: String(raw.title || ''),
      category: String(raw.category || 'General'),
      description: String(raw.description || ''),
      year: Number(raw.year || 0),
      section_count: Number(raw.section_count || 0),
      tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
      download_url: String(raw.download_url || ''),
      active: raw.active !== false,
    });
  });
  return out;
};

educationRouter.get('/library/categories', (_req: Request, res: Response): void => {
  const entries = getLibraryEntries();
  const cats = Array.from(new Set(entries.map((e) => e.category))).sort();
  res.json(cats);
});

educationRouter.get('/library/stats', (_req: Request, res: Response): void => {
  const entries = getLibraryEntries();
  const byCat: Record<string, number> = {};
  entries.forEach((e) => {
    byCat[e.category] = (byCat[e.category] || 0) + 1;
  });
  res.json({
    total_laws: entries.length,
    by_category: byCat,
    total_sections: entries.reduce((sum, e) => sum + (e.section_count || 0), 0),
  });
});

educationRouter.get('/library/search/:query', (req: Request, res: Response): void => {
  const q = (req.params.query || '').toLowerCase();
  const entries = getLibraryEntries().filter((e) => {
    const hay = [e.title, e.description, e.category, ...(e.tags || [])].join(' ').toLowerCase();
    return hay.includes(q);
  });
  res.json({ success: true, data: entries, total: entries.length });
});

educationRouter.get('/library', (req: Request, res: Response): void => {
  const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : undefined;
  const category = typeof req.query.category === 'string' ? req.query.category.toLowerCase() : undefined;
  const tag = typeof req.query.tag === 'string' ? req.query.tag.toLowerCase() : undefined;

  let entries = getLibraryEntries();
  if (category) entries = entries.filter((e) => e.category.toLowerCase() === category);
  if (tag) entries = entries.filter((e) => (e.tags || []).map((t) => t.toLowerCase()).includes(tag));
  if (search) {
    entries = entries.filter((e) => {
      const hay = [e.title, e.description, ...(e.tags || [])].join(' ').toLowerCase();
      return hay.includes(search);
    });
  }
  entries.sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
  res.json(entries);
});

educationRouter.get('/library/:category', (req: Request, res: Response): void => {
  const cat = req.params.category.toLowerCase();
  const items = getLibraryEntries().filter((e) => e.category.toLowerCase().includes(cat));
  res.json({
    success: true,
    data: { category: req.params.category, items },
    total: items.length,
  });
});

// ---------------------------------------------------------------------------
// ASSESSMENTS
// ---------------------------------------------------------------------------
const getAssessment = (id: string): Assessment | undefined => {
  const store = dataService.getEduAssessments();
  const raw = store[id];
  if (!raw) return undefined;
  return raw as Assessment;
};

educationRouter.get('/assessments', (req: Request, res: Response): void => {
  const courseId = typeof req.query.course_id === 'string' ? req.query.course_id : undefined;
  const store = dataService.getEduAssessments();
  const all = Object.values(store) as Assessment[];
  const filtered = all
    .filter((a) => a.active !== false)
    .filter((a) => !courseId || a.course_id === courseId)
    .map<AssessmentPublic>((a) => ({
      id: a.id,
      course_id: a.course_id,
      title: a.title,
      description: a.description,
      pass_mark: a.pass_mark,
      question_count: Array.isArray(a.questions) ? a.questions.length : 0,
      ai_generated: a.ai_generated === true,
    }));
  res.json(filtered);
});

educationRouter.get('/assessments/:assessment_id', (req: Request, res: Response): void => {
  const a = getAssessment(req.params.assessment_id);
  if (!a) {
    res.status(404).json({ success: false, message: 'Assessment not found' });
    return;
  }
  const safeQuestions: QuestionPublic[] = (a.questions || []).map((q) => ({
    id: q.id,
    text: q.text,
    options: q.options,
  }));
  const response: AssessmentWithQuestions = {
    id: a.id,
    course_id: a.course_id,
    title: a.title,
    description: a.description,
    pass_mark: a.pass_mark,
    question_count: safeQuestions.length,
    ai_generated: a.ai_generated === true,
    questions: safeQuestions,
  };
  res.json(response);
});

educationRouter.post('/assessments/:assessment_id/submit', (req: Request, res: Response): void => {
  const a = getAssessment(req.params.assessment_id);
  if (!a) {
    res.status(404).json({ success: false, message: 'Assessment not found' });
    return;
  }
  const body = (req.body || {}) as AnswerSubmitRequest;
  const answers = body.answers || {};

  const results: AnswerResult[] = [];
  let correctCount = 0;

  (a.questions || []).forEach((q) => {
    const chosenRaw = answers[q.id];
    const chosen = chosenRaw == null ? -1 : Number(chosenRaw);
    const correctAnswer = Number(q.correct);
    const isCorrect = chosen === correctAnswer;
    if (isCorrect) correctCount += 1;
    results.push({
      question_id: q.id,
      correct: isCorrect,
      chosen,
      correct_answer: correctAnswer,
      explanation: q.explanation || '',
      law_reference: q.law_reference || '',
    });
  });

  const total = (a.questions || []).length;
  const percentage = total > 0 ? Math.round((correctCount / total) * 1000) / 10 : 0;

  const response: AssessmentResult = {
    assessment_id: a.id,
    score: correctCount,
    total,
    percentage,
    passed: percentage >= a.pass_mark,
    pass_mark: a.pass_mark,
    results,
  };
  res.json(response);
});

educationRouter.delete('/admin/assessments/:assessment_id', (req: Request, res: Response): void => {
  const a = getAssessment(req.params.assessment_id);
  if (!a) {
    res.status(404).json({ success: false, message: 'Assessment not found' });
    return;
  }
  a.active = false;
  a.updated_at = new Date().toISOString();
  dataService.saveEduAssessments();
  res.json({ success: true, message: `'${a.title}' deactivated.` });
});

// ---------------------------------------------------------------------------
// ADMIN: basic manual course CRUD (matches Python /admin/courses)
// ---------------------------------------------------------------------------
educationRouter.post('/admin/courses', (req: Request, res: Response): void => {
  const body = (req.body || {}) as Partial<Course>;
  if (!body.title || !body.desc) {
    res.status(400).json({ success: false, message: 'title and desc are required' });
    return;
  }

  const id = `course-${crypto.randomUUID().replace(/-/g, '').substring(0, 8)}`;
  const now = new Date().toISOString();
  const lessons = Array.isArray(body.lessons) ? body.lessons : [];
  const lessonTitles = lessons.map((l, i) => String(l?.title || `Lesson ${i + 1}`));

  const course: Course = {
    id,
    title: body.title,
    desc: body.desc,
    overview: body.overview || '',
    key_topics: Array.isArray(body.key_topics) ? body.key_topics : [],
    lessons,
    lesson_titles: lessonTitles,
    learning_outcomes: [],
    difficulty_notes: '',
    level: body.level || 'Intermediate',
    hours: Number(body.hours || 4),
    category: body.category || '',
    law_name: '',
    active: true,
    ai_generated: false,
    created_at: now,
    updated_at: now,
  };

  const eduCourses = dataService.getEduCourses();
  eduCourses[id] = course;
  dataService.saveEduCourses();
  res.status(201).json(course);
});

educationRouter.patch('/admin/courses/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const eduCourses = dataService.getEduCourses();
  const course = eduCourses[id];
  if (!course) {
    res.status(404).json({ success: false, message: 'Course not found' });
    return;
  }
  const body = (req.body || {}) as Partial<Course>;
  Object.entries(body).forEach(([key, value]) => {
    if (value !== undefined && value !== null) course[key] = value;
  });
  course.updated_at = new Date().toISOString();
  dataService.saveEduCourses();
  res.json(course);
});

educationRouter.delete('/admin/courses/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const eduCourses = dataService.getEduCourses();
  const course = eduCourses[id];
  if (!course) {
    res.status(404).json({ success: false, message: 'Course not found' });
    return;
  }
  course.active = false;
  course.updated_at = new Date().toISOString();
  dataService.saveEduCourses();
  res.json({ success: true, message: `'${course.title}' deactivated.` });
});
