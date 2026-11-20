import { ParagraphItem, ReviewLog, VocabularyItem } from '../types';
import { FullBackupPayload, generateFullBackup, restoreFullBackup } from './diskSync';

const CLOUD_SYNC_CONFIG_KEY = 'active_recall_cloud_sync_v1';
const GIST_FILENAME = 'activerecall_study_data.json';

export interface CloudSyncConfig {
  token: string;
  gistId: string;
  autoSync: boolean;
  lastSyncedAt: string | null;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncState {
  status: SyncStatus;
  message: string;
  lastSyncedAt: string | null;
}

type SyncListener = (state: SyncState) => void;
const listeners = new Set<SyncListener>();

let currentSyncState: SyncState = {
  status: 'idle',
  message: '',
  lastSyncedAt: null,
};

function notifyListeners(partial: Partial<SyncState>) {
  currentSyncState = { ...currentSyncState, ...partial };
  listeners.forEach(fn => fn(currentSyncState));
}

export function subscribeCloudSync(listener: SyncListener): () => void {
  listeners.add(listener);
  listener(currentSyncState);
  return () => {
    listeners.delete(listener);
  };
}

export function loadCloudSyncConfig(): CloudSyncConfig {
  try {
    const raw = localStorage.getItem(CLOUD_SYNC_CONFIG_KEY);
    if (!raw) {
      return { token: '', gistId: '', autoSync: true, lastSyncedAt: null };
    }
    const parsed = JSON.parse(raw);
    return {
      token: parsed.token || '',
      gistId: parsed.gistId || '',
      autoSync: parsed.autoSync !== false,
      lastSyncedAt: parsed.lastSyncedAt || null,
    };
  } catch {
    return { token: '', gistId: '', autoSync: true, lastSyncedAt: null };
  }
}

export function saveCloudSyncConfig(config: CloudSyncConfig): void {
  localStorage.setItem(CLOUD_SYNC_CONFIG_KEY, JSON.stringify(config));
  if (config.lastSyncedAt) {
    notifyListeners({ lastSyncedAt: config.lastSyncedAt });
  }
}

export function isCloudSyncConfigured(): boolean {
  const cfg = loadCloudSyncConfig();
  return Boolean(cfg.token.trim());
}

function getReviewCount(word: VocabularyItem): number {
  const e2v = word.english_to_vietnamese;
  const v2e = word.vietnamese_to_english;
  return (
    (e2v?.correctCount || 0) +
    (e2v?.incorrectCount || 0) +
    (v2e?.correctCount || 0) +
    (v2e?.incorrectCount || 0)
  );
}

function parseTime(iso?: string | null): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

export function mergeBackupPayloads(
  local: FullBackupPayload,
  remote: FullBackupPayload
): FullBackupPayload {
  // 1. Merge vocabulary by id
  const vocabMap = new Map<string, VocabularyItem>();
  for (const item of remote.vocabulary || []) {
    if (item && item.id) vocabMap.set(item.id, item);
  }
  for (const localItem of local.vocabulary || []) {
    if (!localItem || !localItem.id) continue;
    const remoteItem = vocabMap.get(localItem.id);
    if (!remoteItem) {
      vocabMap.set(localItem.id, localItem);
    } else {
      const localTime = parseTime(localItem.updated_at);
      const remoteTime = parseTime(remoteItem.updated_at);
      if (localTime > remoteTime) {
        vocabMap.set(localItem.id, localItem);
      } else if (localTime === remoteTime) {
        vocabMap.set(
          localItem.id,
          getReviewCount(localItem) >= getReviewCount(remoteItem) ? localItem : remoteItem
        );
      }
    }
  }

  // 2. Merge paragraphs by id
  const paraMap = new Map<string, ParagraphItem>();
  for (const p of remote.paragraphs || []) {
    if (p && p.id) paraMap.set(p.id, p);
  }
  for (const localP of local.paragraphs || []) {
    if (!localP || !localP.id) continue;
    const remoteP = paraMap.get(localP.id);
    if (!remoteP) {
      paraMap.set(localP.id, localP);
    } else {
      const localPracticed = parseTime(localP.last_practiced);
      const remotePracticed = parseTime(remoteP.last_practiced);
      if (
        localPracticed > remotePracticed ||
        (localPracticed === remotePracticed &&
          (localP.practice_count || 0) >= (remoteP.practice_count || 0))
      ) {
        paraMap.set(localP.id, localP);
      }
    }
  }

  // 3. Merge reviewHistory by id (union, sorted chronologically)
  const historyMap = new Map<string, ReviewLog>();
  for (const log of remote.reviewHistory || []) {
    if (log && log.id) historyMap.set(log.id, log);
  }
  for (const log of local.reviewHistory || []) {
    if (log && log.id) historyMap.set(log.id, log);
  }
  const mergedHistory = Array.from(historyMap.values())
    .sort((a, b) => parseTime(a.reviewed_at) - parseTime(b.reviewed_at))
    .slice(-3000);

  // 4. Merge streak
  const localStreak = local.streak || { streak: 1, lastActiveDate: '' };
  const remoteStreak = remote.streak || { streak: 1, lastActiveDate: '' };
  let mergedStreak = localStreak;
  if ((remoteStreak.lastActiveDate || '') > (localStreak.lastActiveDate || '')) {
    mergedStreak = remoteStreak;
  } else if (
    remoteStreak.lastActiveDate === localStreak.lastActiveDate &&
    (remoteStreak.streak || 0) > (localStreak.streak || 0)
  ) {
    mergedStreak = remoteStreak;
  }

  // 5. Settings: prefer local unless remote is significantly newer
  const localExportTime = parseTime(local.exportedAt);
  const remoteExportTime = parseTime(remote.exportedAt);
  const mergedSettings =
    remoteExportTime > localExportTime && remote.settings
      ? remote.settings
      : local.settings || remote.settings;

  return {
    version: Math.max(local.version || 1, remote.version || 1),
    exportedAt: new Date().toISOString(),
    vocabulary: Array.from(vocabMap.values()),
    paragraphs: Array.from(paraMap.values()),
    reviewHistory: mergedHistory,
    streak: mergedStreak,
    settings: mergedSettings,
  };
}

let isSyncInFlight = false;

export async function syncWithCloud(
  mode: 'merge' | 'push' | 'pull' = 'merge'
): Promise<{ success: boolean; message: string; updated?: boolean }> {
  const config = loadCloudSyncConfig();
  const token = config.token.trim();

  if (!token) {
    return {
      success: false,
      message: 'Chưa cấu hình GitHub Token để đồng bộ Cloud.',
    };
  }

  if (isSyncInFlight) {
    return { success: false, message: 'Đang đồng bộ...' };
  }

  isSyncInFlight = true;
  notifyListeners({ status: 'syncing', message: 'Đang đồng bộ với Cloud...' });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  try {
    const localPayload = generateFullBackup();

    // Case 1: No Gist ID yet -> Create a new secret Gist
    if (!config.gistId.trim()) {
      const createRes = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          description: 'ActiveRecall Vocabulary & Study Progress (Auto Sync)',
          public: false,
          files: {
            [GIST_FILENAME]: {
              content: JSON.stringify(localPayload, null, 2),
            },
          },
        }),
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        throw new Error(`Không thể tạo Gist (${createRes.status}): ${errText}`);
      }

      const created = await createRes.json();
      const now = new Date().toISOString();
      saveCloudSyncConfig({
        ...config,
        gistId: created.id,
        lastSyncedAt: now,
      });

      const msg = `Đã tạo Gist mới (${created.id.slice(0, 8)}...) và đẩy ${localPayload.vocabulary.length} từ lên Cloud!`;
      notifyListeners({ status: 'success', message: msg, lastSyncedAt: now });
      return { success: true, message: msg, updated: false };
    }

    // Case 2: Gist ID exists -> Fetch remote Gist
    const gistId = config.gistId.trim();
    const getRes = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!getRes.ok) {
      const errText = await getRes.text();
      throw new Error(`Lỗi đọc Gist (${getRes.status}): ${errText}`);
    }

    const gistData = await getRes.json();
    const files = gistData.files || {};
    const targetFile =
      files[GIST_FILENAME] ||
      files['study_data.json'] ||
      Object.values(files).find((f: any) => f?.filename?.endsWith('.json'));

    let remotePayload: FullBackupPayload | null = null;
    if (targetFile) {
      let rawContent = targetFile.content;
      if (targetFile.truncated && targetFile.raw_url) {
        const rawRes = await fetch(targetFile.raw_url, { cache: 'no-store' });
        rawContent = await rawRes.text();
      }
      if (rawContent) {
        remotePayload = JSON.parse(rawContent);
      }
    }

    let finalPayload = localPayload;
    let updatedLocal = false;

    if (remotePayload && Array.isArray(remotePayload.vocabulary)) {
      if (mode === 'pull') {
        finalPayload = remotePayload;
        restoreFullBackup(finalPayload, { skipCloudSync: true });
        updatedLocal = true;
      } else if (mode === 'merge') {
        finalPayload = mergeBackupPayloads(localPayload, remotePayload);
        restoreFullBackup(finalPayload, { skipCloudSync: true });
        updatedLocal = true;
      }
    }

    if (mode !== 'pull') {
      const patchRes = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          files: {
            [GIST_FILENAME]: {
              content: JSON.stringify(finalPayload, null, 2),
            },
          },
        }),
      });

      if (!patchRes.ok) {
        const errText = await patchRes.text();
        throw new Error(`Lỗi cập nhật Gist (${patchRes.status}): ${errText}`);
      }
    }

    const now = new Date().toISOString();
    saveCloudSyncConfig({
      ...config,
      lastSyncedAt: now,
    });

    const msg = `Đồng bộ thành công (${finalPayload.vocabulary.length} từ, ${finalPayload.reviewHistory?.length || 0} lượt ôn).`;
    notifyListeners({ status: 'success', message: msg, lastSyncedAt: now });
    return { success: true, message: msg, updated: updatedLocal };
  } catch (err: any) {
    const errMsg = err?.message || 'Lỗi kết nối Cloud Sync';
    notifyListeners({ status: 'error', message: errMsg });
    return { success: false, message: errMsg };
  } finally {
    isSyncInFlight = false;
  }
}

let autoSyncTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleAutoCloudSync(delayMs = 3000): void {
  const config = loadCloudSyncConfig();
  if (!config.autoSync || !config.token.trim()) return;

  if (autoSyncTimer) {
    clearTimeout(autoSyncTimer);
  }
  autoSyncTimer = setTimeout(() => {
    autoSyncTimer = null;
    syncWithCloud('merge').catch(() => {});
  }, delayMs);
}
