export type WordStatus = 'new' | 'learning' | 'review' | 'mastered';

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export type ReviewDirection = 'en_to_vi' | 'vi_to_en';

export interface DirectionSRS {
  correctCount: number;
  incorrectCount: number;
  accuracy: number; // 0 - 100 percentage
  interval: number; // in days
  easeFactor: number; // default 2.5
  repetitions: number;
  lastReviewed: string | null; // ISO timestamp
  nextReview: string | null; // ISO timestamp
}

export interface VocabularyItem {
  id: string;
  word: string;
  meaning: string;
  pronunciation?: string;
  part_of_speech?: string;
  example?: string;
  notes?: string;
  topics?: string[];
  collocations?: string[];
  status: WordStatus;
  english_to_vietnamese: DirectionSRS;
  vietnamese_to_english: DirectionSRS;
  created_at: string;
  updated_at: string;
}

export interface ReviewLog {
  id: string;
  word_id: string;
  word: string;
  direction: ReviewDirection;
  user_answer: string;
  correct_answer: string;
  result: 'correct' | 'incorrect' | 'unsure';
  rating: ReviewRating;
  response_time_ms: number;
  reviewed_at: string; // ISO string
}

export interface StudyCard {
  word: VocabularyItem;
  direction: ReviewDirection;
  reason: 'due' | 'weak' | 'new' | 'cumulative' | 'topic';
}

export interface StudySessionState {
  cards: StudyCard[];
  currentIndex: number;
  completedCards: {
    card: StudyCard;
    rating: ReviewRating;
    result: 'correct' | 'incorrect' | 'unsure';
    userAnswer: string;
  }[];
  startTime: number;
  isFinished: boolean;
}

export type StudyMode = 'quick' | 'due' | 'weak' | 'new' | 'cumulative' | 'topic' | 'flashcard';

export interface AppSettings {
  newWordsPerDay: number;
  dailyReviewLimit: number;
  enToViRatio: number; // e.g. 40 (%)
  viToEnRatio: number; // e.g. 60 (%)
  cumulativeCount: number;
  sessionSize: number;
  soundEnabled: boolean;
  autoAudio: boolean;
}

export interface DashboardStats {
  todayTotalDue: number;
  todayDueReviews: number;
  todayNewWords: number;
  todayCumulativeCount: number;
  totalWords: number;
  statusCounts: {
    new: number;
    learning: number;
    review: number;
    mastered: number;
  };
  streakDays: number;
  lastActiveDate: string | null;
  overallAccuracy: number;
  enToViAccuracy: number;
  viToEnAccuracy: number;
  totalReviewsDone: number;
  masteredCount: number;
  todayReviewedCount: number;
}

export interface ParagraphItem {
  id: string;
  title: string;
  topic: string;
  content: string;
  translation_vi?: string;
  keywords?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  created_at: string;
  last_practiced?: string | null;
  best_score?: number | null;
  practice_count?: number;
}

export type BlankingMode = 'keywords' | 'easy' | 'medium' | 'hard' | 'all';
