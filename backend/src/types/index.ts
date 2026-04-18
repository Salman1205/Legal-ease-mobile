// ============================================================================
// User & Auth Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
  updated_at?: string;
}

export interface SessionRecord {
  user_id: string;
  email: string;
  created_at: string;
  expires_at: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  session_token?: string;
  user?: PublicUser;
}

export interface SessionResponse {
  authenticated: boolean;
  user: PublicUser | null;
}

// ============================================================================
// Chat Types
// ============================================================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  message: string;
  conversation_history?: ChatMessage[];
  document_context?: string;
  document_name?: string;
  mode?: 'lawyer' | 'general';
}

export interface SourceInfo {
  law: string;
  title: string;
  section: string;
  relevance: string;
  citation: string;
  url: string;
  category: string;
}

export interface ChatResponse {
  response: string;
  sources: SourceInfo[];
  collections_used: string[];
  status: string;
}

// ============================================================================
// Contract Analysis Types (rich structured response — matches Python)
// ============================================================================

export interface RiskItem {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  original_clause: string | null;
  suggested_fix: string | null;
  law_reference: string | null;
}

export interface MissingClause {
  title: string;
  why_needed: string;
  suggested_text: string;
  law_reference: string | null;
}

export interface ApplicableLaw {
  name: string;
  year: string | null;
  relevance: string;
  key_sections: string[];
}

export interface ContractAnalysis {
  document_type: string;
  parties: string[];
  summary: string;
  compliance_score: number;
  overall_risk: 'critical' | 'high' | 'medium' | 'low';
  risks: RiskItem[];
  missing_clauses: MissingClause[];
  applicable_laws: ApplicableLaw[];
  recommendations: string[];
  timeline: string;
  estimated_cost: string;
  key_dates: string[];
  jurisdiction: string;
}

// ============================================================================
// Document Types
// ============================================================================

export interface DocumentExtractionResult {
  success: boolean;
  extracted_text: string;
  message: string;
  filename: string;
  char_count?: number;
}

// ============================================================================
// Lawyer Types
// ============================================================================

export interface Lawyer {
  id: string;
  name: string;
  specialization: string;
  experience_years: number;
  location: string;
  availability: string;
  languages: string[];
  rating: number;
  review_count: number;
  hourly_rate: number;
  currency: string;
  emoji: string;
  bio: string;
  contact_email: string;
  contact_phone: string;
  bar_council: string;
  bar_number: string;
  verified: boolean;
  active: boolean;
  free_consultation?: string;
  website?: string;
  founded?: number;
  team_size?: number;
  created_at?: string;
  updated_at?: string;
}

export interface LawyerReview {
  id: string;
  lawyer_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface LawyerListResponse {
  lawyers: Lawyer[];
  total: number;
  page: number;
  page_size: number;
}

export interface LawyerCreate {
  name: string;
  specialization: string;
  experience_years: number;
  location: string;
  availability?: string;
  languages?: string[];
  hourly_rate: number;
  currency?: string;
  emoji?: string;
  bio?: string;
  contact_email: string;
  contact_phone: string;
  bar_council: string;
  bar_number: string;
}

export interface LawyerUpdate {
  name?: string;
  specialization?: string;
  experience_years?: number;
  location?: string;
  availability?: string;
  languages?: string[];
  hourly_rate?: number;
  currency?: string;
  emoji?: string;
  bio?: string;
  contact_email?: string;
  contact_phone?: string;
  bar_council?: string;
  bar_number?: string;
  active?: boolean;
}

export interface ReviewCreate {
  user_name: string;
  rating: number;
  comment: string;
}

// ============================================================================
// Education Types
// ============================================================================

export interface CourseLesson {
  index?: number;
  title?: string;
  content?: string;
  key_points?: string[];
  real_world_example?: string;
  what_to_know?: string;
  [key: string]: unknown;
}

export interface Course {
  id: string;
  category: string;
  title: string;
  desc: string;
  overview: string;
  key_topics: string[];
  lessons: CourseLesson[];
  lesson_titles: string[];
  learning_outcomes: string[];
  difficulty_notes: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | string;
  hours: number;
  active: boolean;
  ai_generated: boolean;
  law_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface CoursePublic extends Course {
  progress_percent: number;
  lessons_completed: number;
  last_lesson: number;
  completed: boolean;
}

export interface ProgressRecord {
  lessons_completed: number;
  completed_indices: number[];
  last_lesson: number;
  completed: boolean;
  updated_at: string;
}

export interface ProgressUpdateRequest {
  user_id: string;
  course_id: string;
  lesson_index: number;
}

export interface ProgressResponse {
  user_id: string;
  course_id: string;
  lessons_completed: number;
  total_lessons: number;
  progress_percent: number;
  last_lesson: number;
  completed: boolean;
  updated_at: string;
}

export interface LawEntry {
  id: string;
  title: string;
  category: string;
  description: string;
  year: number;
  section_count: number;
  tags: string[];
  download_url: string;
  active: boolean;
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  options: string[];
  correct: number;
  explanation?: string;
  law_reference?: string;
}

export interface QuestionPublic {
  id: string;
  text: string;
  options: string[];
}

export interface Assessment {
  id: string;
  course_id: string;
  title: string;
  description: string;
  pass_mark: number;
  questions: AssessmentQuestion[];
  active: boolean;
  ai_generated: boolean;
  updated_at?: string;
}

export interface AssessmentPublic {
  id: string;
  course_id: string;
  title: string;
  description: string;
  pass_mark: number;
  question_count: number;
  ai_generated: boolean;
}

export interface AssessmentWithQuestions extends AssessmentPublic {
  questions: QuestionPublic[];
}

export interface AnswerSubmitRequest {
  answers: Record<string, number>;
}

export interface AnswerResult {
  question_id: string;
  correct: boolean;
  chosen: number;
  correct_answer: number;
  explanation: string;
  law_reference: string;
}

export interface AssessmentResult {
  assessment_id: string;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  pass_mark: number;
  results: AnswerResult[];
}

// ============================================================================
// Intent / Query Classification
// ============================================================================

export interface IntentClassification {
  intent: 'document_analysis' | 'legal_query' | 'mixed';
  needs_rag: boolean;
  confidence: number;
}

export interface QueryClassification {
  query_type: 'greeting' | 'informational' | 'legal_analysis' | 'document_specific';
  confidence: number;
  category?: string;
}

// ============================================================================
// Error Response
// ============================================================================

export interface ErrorResponse {
  success: false;
  message: string;
  details?: string;
  status: number;
}
