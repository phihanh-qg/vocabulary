import type { AppSettings, ReviewDirection, StudyCard, StudyMode, VocabularyItem } from '../types/index.ts';
import { isDue } from './srs.ts';

/**
 * Determines which direction (en_to_vi or vi_to_en) should be tested for a given word.
 * Priority:
 * 1. If one direction is due and the other is not, pick the due one.
 * 2. If one direction has lower accuracy with attempts, pick the weaker one.
 * 3. Otherwise, use the user's configured ratio (e.g., 60% vi_to_en productive recall).
 */
export function chooseOptimalDirection(
  word: VocabularyItem,
  settings: AppSettings,
  now: Date = new Date()
): ReviewDirection {
  const enDue = isDue(word.english_to_vietnamese, now);
  const viDue = isDue(word.vietnamese_to_english, now);

  if (enDue && !viDue) return 'en_to_vi';
  if (viDue && !enDue) return 'vi_to_en';

  const enTotal = word.english_to_vietnamese.correctCount + word.english_to_vietnamese.incorrectCount;
  const viTotal = word.vietnamese_to_english.correctCount + word.vietnamese_to_english.incorrectCount;

  // If both have review attempts, compare accuracy
  if (enTotal > 0 && viTotal > 0) {
    if (word.english_to_vietnamese.accuracy < word.vietnamese_to_english.accuracy) {
      return 'en_to_vi';
    }
    if (word.vietnamese_to_english.accuracy < word.english_to_vietnamese.accuracy) {
      return 'vi_to_en';
    }
  }

  // If one has never been practiced in VI->EN, prioritize productive recall
  if (viTotal === 0 && enTotal > 0) {
    return 'vi_to_en';
  }

  // Fallback to configured target ratio
  const rand = Math.random() * 100;
  return rand < settings.viToEnRatio ? 'vi_to_en' : 'en_to_vi';
}

/**
 * Fisher-Yates array shuffle.
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Constructs a scientifically balanced study session queue.
 */
export function buildStudyQueue(
  vocab: VocabularyItem[],
  mode: StudyMode,
  settings: AppSettings,
  now: Date = new Date(),
  selectedTopic?: string
): StudyCard[] {
  // If a topic is selected, filter vocabulary to that topic
  let targetVocab = vocab;
  if (selectedTopic && selectedTopic !== 'all') {
    targetVocab = vocab.filter(w => 
      w.topics?.some(t => t.toLowerCase() === selectedTopic.toLowerCase())
    );
  }

  const sessionTargetSize = settings.sessionSize || 20;

  if (mode === 'topic') {
    // Practice all words in selected topic
    const topicCards: StudyCard[] = targetVocab.map(word => ({
      word,
      direction: chooseOptimalDirection(word, settings, now),
      reason: 'topic',
    }));
    return shuffleArray(topicCards).slice(0, sessionTargetSize);
  }

  if (mode === 'due') {
    // Only due words
    const dueCards: StudyCard[] = [];
    for (const word of vocab) {
      const enDue = isDue(word.english_to_vietnamese, now);
      const viDue = isDue(word.vietnamese_to_english, now);
      if (viDue) dueCards.push({ word, direction: 'vi_to_en', reason: 'due' });
      if (enDue) dueCards.push({ word, direction: 'en_to_vi', reason: 'due' });
    }
    return shuffleArray(dueCards).slice(0, sessionTargetSize);
  }

  if (mode === 'weak') {
    // Only words where either direction has accuracy < 70% with at least 1 attempt
    const weakCards: StudyCard[] = [];
    for (const word of vocab) {
      const enTotal = word.english_to_vietnamese.correctCount + word.english_to_vietnamese.incorrectCount;
      const viTotal = word.vietnamese_to_english.correctCount + word.vietnamese_to_english.incorrectCount;

      if (viTotal > 0 && word.vietnamese_to_english.accuracy < 70) {
        weakCards.push({ word, direction: 'vi_to_en', reason: 'weak' });
      }
      if (enTotal > 0 && word.english_to_vietnamese.accuracy < 70) {
        weakCards.push({ word, direction: 'en_to_vi', reason: 'weak' });
      }
    }
    return shuffleArray(weakCards).slice(0, sessionTargetSize);
  }

  if (mode === 'new') {
    // Only new unseen words
    const newWords = vocab.filter(w => w.status === 'new');
    const newCards: StudyCard[] = newWords.map(word => ({
      word,
      direction: chooseOptimalDirection(word, settings, now),
      reason: 'new',
    }));
    return shuffleArray(newCards).slice(0, Math.min(settings.newWordsPerDay, sessionTargetSize));
  }

  if (mode === 'cumulative') {
    // Only older reviewed/mastered words with interval >= 3
    const olderWords = vocab.filter(w => {
      const maxInterval = Math.max(w.english_to_vietnamese.interval, w.vietnamese_to_english.interval);
      return (w.status === 'review' || w.status === 'mastered') && maxInterval >= 3;
    });
    const cumulativeCards: StudyCard[] = olderWords.map(word => ({
      word,
      direction: chooseOptimalDirection(word, settings, now),
      reason: 'cumulative',
    }));
    return shuffleArray(cumulativeCards).slice(0, sessionTargetSize);
  }

  // --- MODE: 'quick' (Default Balanced Cumulative Session) ---
  // Step 1: Gather Due items
  const dueItems: StudyCard[] = [];
  const dueWordIds = new Set<string>();

  for (const word of vocab) {
    const enDue = isDue(word.english_to_vietnamese, now);
    const viDue = isDue(word.vietnamese_to_english, now);
    if (viDue) {
      dueItems.push({ word, direction: 'vi_to_en', reason: 'due' });
      dueWordIds.add(word.id);
    }
    if (enDue) {
      dueItems.push({ word, direction: 'en_to_vi', reason: 'due' });
      dueWordIds.add(word.id);
    }
  }

  // Step 2: Gather Weak items (not already in due)
  const weakItems: StudyCard[] = [];
  for (const word of vocab) {
    if (dueWordIds.has(word.id)) continue;
    const enTotal = word.english_to_vietnamese.correctCount + word.english_to_vietnamese.incorrectCount;
    const viTotal = word.vietnamese_to_english.correctCount + word.vietnamese_to_english.incorrectCount;

    if (viTotal > 0 && word.vietnamese_to_english.accuracy < 65) {
      weakItems.push({ word, direction: 'vi_to_en', reason: 'weak' });
    } else if (enTotal > 0 && word.english_to_vietnamese.accuracy < 65) {
      weakItems.push({ word, direction: 'en_to_vi', reason: 'weak' });
    }
  }

  // Step 3: Gather New items
  const newItems: StudyCard[] = vocab
    .filter(w => w.status === 'new')
    .map(word => ({
      word,
      direction: chooseOptimalDirection(word, settings, now),
      reason: 'new' as const,
    }));

  // Step 4: Gather Cumulative items (mature words not in due or weak)
  const cumulativeItems: StudyCard[] = vocab
    .filter(w => {
      if (dueWordIds.has(w.id)) return false;
      const maxInterval = Math.max(w.english_to_vietnamese.interval, w.vietnamese_to_english.interval);
      return (w.status === 'review' || w.status === 'mastered') && maxInterval >= 2;
    })
    .map(word => ({
      word,
      direction: chooseOptimalDirection(word, settings, now),
      reason: 'cumulative' as const,
    }));

  // Compose the session according to target budget
  const maxNew = Math.min(settings.newWordsPerDay, 8);
  const maxCumulative = Math.max(settings.cumulativeCount || 4, 3);

  const selectedNew = shuffleArray(newItems).slice(0, maxNew);
  const selectedCumulative = shuffleArray(cumulativeItems).slice(0, maxCumulative);
  const selectedWeak = shuffleArray(weakItems).slice(0, 4);

  // Take remaining slots for due items (or all due items if space allows)
  const remainingSlots = Math.max(0, sessionTargetSize - (selectedNew.length + selectedCumulative.length + selectedWeak.length));
  const selectedDue = shuffleArray(dueItems).slice(0, Math.max(remainingSlots, 8));

  const combined = [
    ...selectedDue,
    ...selectedWeak,
    ...selectedNew,
    ...selectedCumulative,
  ];

  // If still less than sessionTargetSize and we have leftover words, backfill
  if (combined.length < sessionTargetSize && vocab.length > 0) {
    const includedIds = new Set(combined.map(c => c.word.id + c.direction));
    for (const word of shuffleArray(vocab)) {
      if (combined.length >= sessionTargetSize) break;
      const dir = chooseOptimalDirection(word, settings, now);
      if (!includedIds.has(word.id + dir)) {
        combined.push({
          word,
          direction: dir,
          reason: word.status === 'new' ? 'new' : 'cumulative',
        });
        includedIds.add(word.id + dir);
      }
    }
  }

  return shuffleArray(combined).slice(0, sessionTargetSize);
}
