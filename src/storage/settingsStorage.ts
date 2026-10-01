import type { AppSettings } from '../types/index.ts';

const SETTINGS_KEY = 'active_recall_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  newWordsPerDay: 10,
  dailyReviewLimit: 30,
  enToViRatio: 40,
  viToEnRatio: 60,
  cumulativeCount: 5,
  sessionSize: 20,
  soundEnabled: true,
  autoAudio: false,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}
