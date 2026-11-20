import { Capacitor, registerPlugin } from '@capacitor/core';
import { VocabularyItem } from '../types';
import { loadVocabulary, saveVocabulary } from '../storage/vocabStorage';
import { appendReviewLog } from '../storage/historyStorage';
import { calculateNextSRS, computeWordStatus, isDue } from '../engine/srs';

interface VocabWidgetPluginInterface {
  syncWords(options: { wordsJson: string }): Promise<void>;
  setLockScreenConfig(options: { enabled: boolean; autoPopup: boolean }): Promise<void>;
  getLockScreenConfig(): Promise<{ enabled: boolean; autoPopup: boolean; canDrawOverlays: boolean }>;
  requestOverlayPermission(): Promise<void>;
  popPendingReviews(): Promise<{ reviewsJson: string }>;
  openQuickRecall(): Promise<void>;
}

const VocabWidget = registerPlugin<VocabWidgetPluginInterface>('VocabWidget');

export function isAndroidNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export async function syncWordsToAndroidWidget(words: VocabularyItem[]): Promise<void> {
  if (!isAndroidNative()) return;
  try {
    const now = new Date();
    // Prioritize due or unmastered words first for widget/lockscreen
    const prioritized = [...words].sort((a, b) => {
      const aDue = isDue(a.english_to_vietnamese, now) ? 0 : 1;
      const bDue = isDue(b.english_to_vietnamese, now) ? 0 : 1;
      if (aDue !== bDue) return aDue - bDue;
      if (a.status === 'mastered' && b.status !== 'mastered') return 1;
      if (a.status !== 'mastered' && b.status === 'mastered') return -1;
      return 0;
    });

    const compact = prioritized.map(w => ({
      id: w.id,
      word: w.word,
      meaning: w.meaning,
      pronunciation: w.pronunciation || '',
      part_of_speech: w.part_of_speech || '',
      example: w.example || '',
    }));

    await VocabWidget.syncWords({ wordsJson: JSON.stringify(compact) });
  } catch (err) {
    console.error('Failed to sync words to Android widget:', err);
  }
}

export async function consumePendingNativeReviews(): Promise<boolean> {
  if (!isAndroidNative()) return false;
  try {
    const { reviewsJson } = await VocabWidget.popPendingReviews();
    const pending: Array<{ wordId: string; correct: boolean; reviewedAt: number }> = JSON.parse(
      reviewsJson || '[]'
    );
    if (!Array.isArray(pending) || pending.length === 0) return false;

    const vocab = loadVocabulary();
    let changed = false;

    for (const item of pending) {
      const idx = vocab.findIndex(w => w.id === item.wordId);
      if (idx === -1) continue;

      const word = vocab[idx];
      const reviewDate = new Date(item.reviewedAt || Date.now());
      const rating = item.correct ? 'good' : 'again';
      const updatedEnToVi = calculateNextSRS(
        word.english_to_vietnamese,
        rating,
        item.correct,
        reviewDate
      );

      const tempWord: VocabularyItem = {
        ...word,
        english_to_vietnamese: updatedEnToVi,
        updated_at: reviewDate.toISOString(),
      };
      const updatedWord: VocabularyItem = {
        ...tempWord,
        status: computeWordStatus(tempWord),
      };
      vocab[idx] = updatedWord;
      changed = true;

      appendReviewLog({
        id: 'native-' + item.reviewedAt + '-' + Math.random().toString(36).slice(2, 6),
        word_id: word.id,
        word: word.word,
        direction: 'en_to_vi',
        user_answer: item.correct ? '(widget/lockscreen: đúng)' : '(widget/lockscreen: sai)',
        correct_answer: word.meaning,
        result: item.correct ? 'correct' : 'incorrect',
        rating,
        response_time_ms: 0,
        reviewed_at: reviewDate.toISOString(),
      });
    }

    if (changed) {
      saveVocabulary(vocab);
    }
    return changed;
  } catch (err) {
    console.error('Failed to consume pending native reviews:', err);
    return false;
  }
}

export async function getLockScreenWidgetConfig(): Promise<{
  enabled: boolean;
  autoPopup: boolean;
  canDrawOverlays: boolean;
}> {
  if (!isAndroidNative()) {
    return { enabled: false, autoPopup: false, canDrawOverlays: false };
  }
  return VocabWidget.getLockScreenConfig();
}

export async function setLockScreenWidgetConfig(
  enabled: boolean,
  autoPopup: boolean
): Promise<void> {
  if (!isAndroidNative()) return;
  await VocabWidget.setLockScreenConfig({ enabled, autoPopup });
}

export async function requestOverlayPermission(): Promise<void> {
  if (!isAndroidNative()) return;
  await VocabWidget.requestOverlayPermission();
}

export async function openQuickRecallScreen(): Promise<void> {
  if (!isAndroidNative()) return;
  await VocabWidget.openQuickRecall();
}
