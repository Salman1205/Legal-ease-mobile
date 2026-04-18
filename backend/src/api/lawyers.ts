import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import {
  Lawyer,
  LawyerReview,
  LawyerListResponse,
  LawyerCreate,
  LawyerUpdate,
  ReviewCreate,
} from '../types/index.js';
import { dataService } from '../services/data.js';

export const lawyersRouter = Router();

const LAWYER_PUBLIC_FIELDS: (keyof Lawyer)[] = [
  'id', 'name', 'specialization', 'experience_years', 'location', 'availability',
  'languages', 'rating', 'review_count', 'hourly_rate', 'currency', 'emoji',
  'bio', 'contact_email', 'contact_phone', 'bar_council', 'bar_number',
  'verified', 'active', 'free_consultation', 'website', 'founded', 'team_size',
];

const toPublic = (raw: Record<string, any>): Lawyer => {
  const obj: Record<string, unknown> = {};
  LAWYER_PUBLIC_FIELDS.forEach((key) => {
    if (raw[key] !== undefined) obj[key] = raw[key];
  });
  return obj as unknown as Lawyer;
};

const readReviews = (lawyerId: string): LawyerReview[] => {
  const allReviews = dataService.getLawyerReviews();
  const list = allReviews[lawyerId];
  return Array.isArray(list) ? (list as LawyerReview[]) : [];
};

const writeReviews = (lawyerId: string, list: LawyerReview[]): void => {
  const allReviews = dataService.getLawyerReviews();
  allReviews[lawyerId] = list;
  dataService.saveLawyerReviews();
};

const recalculateRating = (lawyerId: string): void => {
  const reviews = readReviews(lawyerId);
  if (reviews.length === 0) return;
  const avg = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length;
  const lawyers = dataService.getLawyers();
  const lawyer = lawyers[lawyerId];
  if (!lawyer) return;
  lawyer.rating = Math.round(avg * 10) / 10;
  lawyer.review_count = reviews.length;
  lawyer.updated_at = new Date().toISOString();
  dataService.saveLawyers();
};

interface ListFilters {
  search?: string;
  specialization?: string;
  location?: string;
  min_rating?: number;
  max_rate?: number;
  language?: string;
  verified_only?: boolean;
}

const applyFilters = (lawyers: Lawyer[], f: ListFilters): Lawyer[] =>
  lawyers.filter((l) => {
    if (l.active === false) return false;
    if (f.verified_only && !l.verified) return false;
    if (f.min_rating != null && Number(l.rating) < f.min_rating) return false;
    if (f.max_rate != null && Number(l.hourly_rate) > f.max_rate) return false;
    if (f.location && String(l.location).toLowerCase() !== f.location.toLowerCase()) return false;
    if (f.specialization && !String(l.specialization).toLowerCase().includes(f.specialization.toLowerCase())) return false;
    if (f.language) {
      const langs = (l.languages || []).map((lang) => String(lang).toLowerCase());
      if (!langs.includes(f.language.toLowerCase())) return false;
    }
    if (f.search) {
      const q = f.search.toLowerCase();
      const searchable = `${l.name} ${l.specialization} ${l.location} ${l.bio || ''}`.toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    return true;
  });

const parseNum = (v: unknown): number | undefined => {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

// ---------------------------------------------------------------------------
// META endpoints MUST come before `/:id` routes to avoid being swallowed
// ---------------------------------------------------------------------------
lawyersRouter.get('/meta/specializations', (_req: Request, res: Response): void => {
  const lawyers = Object.values(dataService.getLawyers()) as Lawyer[];
  const specs = new Set<string>();
  lawyers.forEach((l) => {
    if (l.active !== false && l.specialization) specs.add(l.specialization);
  });
  res.json(Array.from(specs).sort());
});

lawyersRouter.get('/meta/cities', (_req: Request, res: Response): void => {
  const lawyers = Object.values(dataService.getLawyers()) as Lawyer[];
  const cities = new Set<string>();
  lawyers.forEach((l) => {
    if (l.active !== false && l.location) cities.add(l.location);
  });
  res.json(Array.from(cities).sort());
});

// ---------------------------------------------------------------------------
// LIST + FILTER + PAGINATE
// ---------------------------------------------------------------------------
lawyersRouter.get('/', (req: Request, res: Response): void => {
  try {
    const q = req.query;
    const filters: ListFilters = {
      search: typeof q.search === 'string' ? q.search : undefined,
      specialization: typeof q.specialization === 'string' ? q.specialization : undefined,
      location: typeof q.location === 'string' ? q.location : undefined,
      min_rating: parseNum(q.min_rating),
      max_rate: parseNum(q.max_rate),
      language: typeof q.language === 'string' ? q.language : undefined,
      verified_only: q.verified_only === 'true',
    };

    const page = Math.max(1, parseNum(q.page) ?? 1);
    const pageSize = Math.max(1, Math.min(100, parseNum(q.page_size) ?? 20));

    const all = (Object.values(dataService.getLawyers()) as Record<string, any>[]).map(toPublic);
    const filtered = applyFilters(all, filters);

    filtered.sort((a, b) => {
      if (a.verified !== b.verified) return a.verified ? -1 : 1;
      return Number(b.rating) - Number(a.rating);
    });

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const pageData = filtered.slice(start, start + pageSize);

    const response: LawyerListResponse = {
      lawyers: pageData,
      total,
      page,
      page_size: pageSize,
    };
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list lawyers';
    res.status(500).json({ success: false, message });
  }
});

// ---------------------------------------------------------------------------
// ADMIN CRUD — must come before `/:id` routes
// ---------------------------------------------------------------------------
lawyersRouter.post('/admin/create', (req: Request, res: Response): void => {
  try {
    const data = (req.body || {}) as LawyerCreate;
    if (!data.name || !data.specialization || data.experience_years == null) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const lawyer: Lawyer = {
      id,
      name: data.name,
      specialization: data.specialization,
      experience_years: data.experience_years,
      location: data.location,
      availability: data.availability || 'Available',
      languages: data.languages || ['English', 'Urdu'],
      rating: 0,
      review_count: 0,
      hourly_rate: data.hourly_rate,
      currency: data.currency || 'PKR',
      emoji: data.emoji || '⚖️',
      bio: data.bio || '',
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      bar_council: data.bar_council,
      bar_number: data.bar_number,
      verified: false,
      active: true,
      created_at: now,
      updated_at: now,
    };

    const lawyers = dataService.getLawyers();
    lawyers[id] = lawyer;
    dataService.saveLawyers();

    res.status(201).json(toPublic(lawyer));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create lawyer';
    res.status(500).json({ success: false, message });
  }
});

lawyersRouter.patch('/admin/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const lawyers = dataService.getLawyers();
  const lawyer = lawyers[id];
  if (!lawyer) {
    res.status(404).json({ success: false, message: 'Lawyer not found' });
    return;
  }

  const body = (req.body || {}) as LawyerUpdate;
  Object.entries(body).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      lawyer[key] = value;
    }
  });
  lawyer.updated_at = new Date().toISOString();
  dataService.saveLawyers();
  res.json(toPublic(lawyer));
});

lawyersRouter.delete('/admin/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const lawyers = dataService.getLawyers();
  const lawyer = lawyers[id];
  if (!lawyer) {
    res.status(404).json({ success: false, message: 'Lawyer not found' });
    return;
  }
  lawyer.active = false;
  lawyer.updated_at = new Date().toISOString();
  dataService.saveLawyers();
  res.json({ success: true, message: `Lawyer '${lawyer.name}' deactivated.` });
});

// ---------------------------------------------------------------------------
// REVIEWS — scoped to :id
// ---------------------------------------------------------------------------
lawyersRouter.get('/:id/reviews', (req: Request, res: Response): void => {
  const { id } = req.params;
  const lawyers = dataService.getLawyers();
  if (!lawyers[id]) {
    res.status(404).json({ success: false, message: 'Lawyer not found' });
    return;
  }
  const reviews = [...readReviews(id)].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  res.json(reviews);
});

lawyersRouter.post('/:id/reviews', (req: Request, res: Response): void => {
  const { id } = req.params;
  const lawyers = dataService.getLawyers();
  if (!lawyers[id]) {
    res.status(404).json({ success: false, message: 'Lawyer not found' });
    return;
  }

  const body = (req.body || {}) as ReviewCreate & { user_id?: string };
  const userName = body.user_name;
  const rating = Number(body.rating);
  const comment = body.comment;

  if (!userName || userName.trim().length < 2) {
    res.status(400).json({ success: false, message: 'user_name is required (min 2 chars)' });
    return;
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    return;
  }
  if (!comment || comment.trim().length < 10 || comment.length > 1000) {
    res.status(400).json({ success: false, message: 'Comment must be 10-1000 characters' });
    return;
  }

  const review: LawyerReview = {
    id: crypto.randomUUID(),
    lawyer_id: id,
    user_name: userName.trim(),
    rating: Math.round(rating * 10) / 10,
    comment: comment.trim(),
    created_at: new Date().toISOString(),
  };

  const reviews = readReviews(id);
  reviews.push(review);
  writeReviews(id, reviews);
  recalculateRating(id);

  res.status(201).json(review);
});

// ---------------------------------------------------------------------------
// GET BY ID — keep last so it doesn't capture /meta/* or /admin/*
// ---------------------------------------------------------------------------
lawyersRouter.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const lawyers = dataService.getLawyers();
  const lawyer = lawyers[id];
  if (!lawyer) {
    res.status(404).json({ success: false, message: 'Lawyer not found' });
    return;
  }
  res.json(toPublic(lawyer));
});
