import { loadVocabulary, saveVocabulary } from './vocabStorage';
import { loadReviewLogs } from './historyStorage';
import { loadSettings, saveSettings } from './settingsStorage';
import { loadParagraphs, saveParagraphs } from './paragraphStorage';

export interface FullBackupPayload {
  version: number;
  exportedAt: string;
  vocabulary: any[];
  paragraphs?: any[];
  reviewHistory: any[];
  streak: any;
  settings: any;
}

export function generateFullBackup(): FullBackupPayload {
  const vocab = loadVocabulary();
  const paragraphs = loadParagraphs();
  const history = loadReviewLogs();
  const settings = loadSettings();
  
  let streak = { streak: 1, lastActiveDate: new Date().toISOString().split('T')[0] };
  try {
    const rawStreak = localStorage.getItem('active_recall_streak_v1');
    if (rawStreak) streak = JSON.parse(rawStreak);
  } catch {}

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    vocabulary: vocab,
    paragraphs,
    reviewHistory: history,
    streak,
    settings,
  };
}

export function restoreFullBackup(data: FullBackupPayload): { success: boolean; message: string } {
  try {
    if (!data.vocabulary || !Array.isArray(data.vocabulary)) {
      return { success: false, message: 'Dữ liệu sao lưu không hợp lệ (thiếu danh sách từ vựng).' };
    }

    // Restore vocabulary
    saveVocabulary(data.vocabulary);

    // Restore paragraphs
    if (data.paragraphs && Array.isArray(data.paragraphs)) {
      saveParagraphs(data.paragraphs);
    }

    // Restore review history
    if (data.reviewHistory && Array.isArray(data.reviewHistory)) {
      localStorage.setItem('active_recall_review_history_v1', JSON.stringify(data.reviewHistory));
    }

    // Restore streak
    if (data.streak) {
      localStorage.setItem('active_recall_streak_v1', JSON.stringify(data.streak));
    }

    // Restore settings
    if (data.settings) {
      saveSettings(data.settings);
    }

    // Also sync to disk
    syncToDisk();

    return { 
      success: true, 
      message: `Khôi phục thành công ${data.vocabulary.length} từ vựng và ${data.reviewHistory?.length || 0} lượt sử ôn tập!` 
    };
  } catch (err: any) {
    return { success: false, message: `Lỗi khôi phục: ${err.message}` };
  }
}

/**
 * Asynchronously syncs full database directly to local disk (data/study_data.json)
 */
export async function syncToDisk(): Promise<boolean> {
  try {
    const payload = generateFullBackup();
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload, null, 2),
    });
    return res.ok;
  } catch (err) {
    // In production static hosting without Vite server, silently fallback to localStorage
    return false;
  }
}

/**
 * Checks if local disk has backup data and restores it if localStorage is empty
 */
export async function syncFromDisk(): Promise<boolean> {
  try {
    const res = await fetch('/api/sync');
    if (!res.ok) return false;
    const data: FullBackupPayload = await res.json();
    if (data && data.vocabulary && data.vocabulary.length > 0) {
      const localVocab = loadVocabulary();
      // If disk has data and local is default/empty or older, sync
      if (localVocab.length <= 30 && data.reviewHistory && data.reviewHistory.length > 0) {
        restoreFullBackup(data);
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}
