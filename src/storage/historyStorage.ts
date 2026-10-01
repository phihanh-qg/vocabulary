import { ReviewLog } from '../types';

const HISTORY_KEY = 'active_recall_review_history_v1';
const STREAK_KEY = 'active_recall_streak_v1';

interface StreakData {
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
}

export function loadReviewLogs(): ReviewLog[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load review logs:', err);
    return [];
  }
}

export function appendReviewLog(log: ReviewLog): void {
  try {
    const logs = loadReviewLogs();
    logs.push(log);
    // Keep last 2,000 logs to prevent exceeding quota
    const trimmed = logs.slice(-2000);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    updateStreak();
  } catch (err) {
    console.error('Failed to append review log:', err);
  }
}

export function getWordHistory(wordId: string): ReviewLog[] {
  const logs = loadReviewLogs();
  return logs
    .filter(l => l.word_id === wordId)
    .sort((a, b) => new Date(b.reviewed_at).getTime() - new Date(a.reviewed_at).getTime());
}

export function getTodayReviewedCount(): number {
  const logs = loadReviewLogs();
  const todayStr = new Date().toISOString().split('T')[0];
  return logs.filter(l => l.reviewed_at.startsWith(todayStr)).length;
}

export function getStreakInfo(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) {
      return { streak: 1, lastActiveDate: new Date().toISOString().split('T')[0] };
    }
    return JSON.parse(raw);
  } catch {
    return { streak: 1, lastActiveDate: new Date().toISOString().split('T')[0] };
  }
}

export function updateStreak(): StreakData {
  const todayStr = new Date().toISOString().split('T')[0];
  const current = getStreakInfo();

  if (!current.lastActiveDate) {
    const fresh = { streak: 1, lastActiveDate: todayStr };
    localStorage.setItem(STREAK_KEY, JSON.stringify(fresh));
    return fresh;
  }

  if (current.lastActiveDate === todayStr) {
    return current;
  }

  const lastDate = new Date(current.lastActiveDate);
  const todayDate = new Date(todayStr);
  const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  let newStreak = current.streak;
  if (diffDays === 1) {
    newStreak += 1;
  } else if (diffDays > 1) {
    newStreak = 1;
  }

  const updated: StreakData = { streak: newStreak, lastActiveDate: todayStr };
  localStorage.setItem(STREAK_KEY, JSON.stringify(updated));
  return updated;
}

export function getPast7DaysActivity(): { date: string; label: string; count: number; accuracy: number }[] {
  const logs = loadReviewLogs();
  const result: { date: string; label: string; count: number; accuracy: number }[] = [];

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLogs = logs.filter(l => l.reviewed_at.startsWith(dateStr));
    const count = dayLogs.length;
    const correctCount = dayLogs.filter(l => l.result === 'correct').length;
    const accuracy = count > 0 ? Math.round((correctCount / count) * 100) : 0;
    const dayLabel = dayNames[d.getDay()];

    result.push({
      date: dateStr,
      label: dayLabel,
      count,
      accuracy,
    });
  }

  return result;
}
