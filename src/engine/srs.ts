import type { DirectionSRS, ReviewRating, VocabularyItem, WordStatus } from '../types/index.ts';

export interface SRSCalculationResult {
  updatedSRS: DirectionSRS;
  newOverallStatus: WordStatus;
}

/**
 * Calculates new interval, ease factor, repetition count and next review date
 * using a refined SM-2 spaced repetition algorithm tailored for dual-direction active recall.
 */
export function calculateNextSRS(
  currentSRS: DirectionSRS,
  rating: ReviewRating,
  isCorrect: boolean,
  now: Date = new Date()
): DirectionSRS {
  let { interval, easeFactor, repetitions, correctCount, incorrectCount } = currentSRS;

  if (isCorrect) {
    correctCount += 1;
  } else {
    incorrectCount += 1;
  }

  const totalReviews = correctCount + incorrectCount;
  const accuracy = totalReviews > 0 ? Math.round((correctCount / totalReviews) * 100) : 0;

  switch (rating) {
    case 'again': {
      // Failed recall: reset repetitions and schedule for immediate review
      repetitions = 0;
      interval = 0; // due immediately today / in session
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      break;
    }

    case 'hard': {
      // Struggled recall: smaller interval expansion
      if (repetitions === 0) {
        interval = 1;
        repetitions = 1;
      } else {
        interval = Math.max(1, Math.round(interval * 1.2));
        repetitions += 1;
      }
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      break;
    }

    case 'good': {
      // Successful standard recall
      if (repetitions === 0) {
        interval = 1;
        repetitions = 1;
      } else if (repetitions === 1) {
        interval = 3;
        repetitions = 2;
      } else {
        interval = Math.max(interval + 1, Math.round(interval * easeFactor));
        repetitions += 1;
      }
      // Ease factor remains stable on standard good recall
      break;
    }

    case 'easy': {
      // High confidence rapid recall: bonus interval and ease factor bump
      if (repetitions === 0) {
        interval = 3;
        repetitions = 1;
      } else if (repetitions === 1) {
        interval = 7;
        repetitions = 2;
      } else {
        interval = Math.max(interval + 3, Math.round(interval * easeFactor * 1.35));
        repetitions += 1;
      }
      easeFactor = Math.min(3.2, easeFactor + 0.15);
      break;
    }
  }

  // Calculate next review timestamp
  // interval in days: 0 means in 10 minutes or immediate today
  const nextDate = new Date(now.getTime());
  if (interval === 0) {
    nextDate.setMinutes(nextDate.getMinutes() + 10);
  } else {
    nextDate.setDate(nextDate.getDate() + interval);
    // Align review to morning/start of that day for consistency
    nextDate.setHours(4, 0, 0, 0);
  }

  return {
    correctCount,
    incorrectCount,
    accuracy,
    interval,
    easeFactor: Math.round(easeFactor * 100) / 100,
    repetitions,
    lastReviewed: now.toISOString(),
    nextReview: nextDate.toISOString(),
  };
}

/**
 * Computes overall word status considering both directions.
 */
export function computeWordStatus(word: VocabularyItem): WordStatus {
  const enVi = word.english_to_vietnamese;
  const viEn = word.vietnamese_to_english;

  const totalReps = enVi.repetitions + viEn.repetitions;
  if (totalReps === 0) {
    return 'new';
  }

  // If both directions have matured significantly (interval >= 21 days & accuracy >= 80%)
  if (
    enVi.interval >= 21 &&
    viEn.interval >= 21 &&
    enVi.accuracy >= 80 &&
    viEn.accuracy >= 80
  ) {
    return 'mastered';
  }

  // If either direction is still in initial learning phase (< 3 days interval)
  if (enVi.interval < 3 || viEn.interval < 3) {
    return 'learning';
  }

  return 'review';
}

/**
 * Checks if a directional SRS item is due for review today.
 */
export function isDue(srs: DirectionSRS, now: Date = new Date()): boolean {
  if (!srs.nextReview) return false;
  return new Date(srs.nextReview).getTime() <= now.getTime();
}
