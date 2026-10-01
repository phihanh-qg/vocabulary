import { DashboardStats, VocabularyItem } from '../types';
import { SEED_VOCABULARY, createInitialDirectionSRS } from '../data/seedData';
import { isDue } from '../engine/srs';
import { getStreakInfo, getTodayReviewedCount } from './historyStorage';

const VOCAB_KEY = 'active_recall_vocab_v1';

export function loadVocabulary(): VocabularyItem[] {
  try {
    const raw = localStorage.getItem(VOCAB_KEY);
    if (!raw) {
      // First time initialization with rich seed data
      saveVocabulary(SEED_VOCABULARY);
      return SEED_VOCABULARY;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveVocabulary(SEED_VOCABULARY);
      return SEED_VOCABULARY;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load vocabulary:', err);
    return SEED_VOCABULARY;
  }
}

export function saveVocabulary(items: VocabularyItem[]): void {
  try {
    localStorage.setItem(VOCAB_KEY, JSON.stringify(items));
    // Asynchronously backup directly to disk
    import('./diskSync').then(m => m.syncToDisk()).catch(() => {});
  } catch (err) {
    console.error('Failed to save vocabulary:', err);
  }
}

export function addVocabularyWord(newWord: {
  word: string;
  meaning: string;
  pronunciation?: string;
  part_of_speech?: string;
  example?: string;
  notes?: string;
  topics?: string[];
  collocations?: string[];
}): VocabularyItem {
  const list = loadVocabulary();
  const item: VocabularyItem = {
    id: 'vocab-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    word: newWord.word.trim(),
    meaning: newWord.meaning.trim(),
    pronunciation: newWord.pronunciation?.trim() || '',
    part_of_speech: newWord.part_of_speech?.trim() || 'verb',
    example: newWord.example?.trim() || '',
    notes: newWord.notes?.trim() || '',
    topics: newWord.topics || ['General'],
    collocations: newWord.collocations || [],
    status: 'new',
    english_to_vietnamese: createInitialDirectionSRS(),
    vietnamese_to_english: createInitialDirectionSRS(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  list.unshift(item);
  saveVocabulary(list);
  return item;
}

export function updateVocabularyWord(updatedItem: VocabularyItem): void {
  const list = loadVocabulary();
  const index = list.findIndex(w => w.id === updatedItem.id);
  if (index !== -1) {
    list[index] = {
      ...updatedItem,
      updated_at: new Date().toISOString(),
    };
    saveVocabulary(list);
  }
}

export function deleteVocabularyWord(id: string): void {
  const list = loadVocabulary();
  const filtered = list.filter(w => w.id !== id);
  saveVocabulary(filtered);
}

export function deleteMultipleVocabularyWords(ids: string[]): void {
  const idSet = new Set(ids);
  const list = loadVocabulary();
  const filtered = list.filter(w => !idSet.has(w.id));
  saveVocabulary(filtered);
}

export function resetWordSRS(id: string): void {
  const list = loadVocabulary();
  const index = list.findIndex(w => w.id === id);
  if (index !== -1) {
    list[index].english_to_vietnamese = createInitialDirectionSRS();
    list[index].vietnamese_to_english = createInitialDirectionSRS();
    list[index].status = 'new';
    list[index].updated_at = new Date().toISOString();
    saveVocabulary(list);
  }
}

/**
 * Parses CSV text into vocabulary items
 */
export function importFromCSV(csvText: string): { added: number; errors: string[] } {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return { added: 0, errors: ['Tệp CSV rỗng'] };

  const errors: string[] = [];
  let added = 0;
  const currentList = loadVocabulary();
  const existingWords = new Set(currentList.map(w => w.word.toLowerCase()));

  // Check header
  const headerLine = lines[0].toLowerCase();
  const hasHeader = headerLine.includes('word') || headerLine.includes('meaning');
  const startIndex = hasHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV splitter respecting quotes if present
    const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g;
    const cols: string[] = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      const val = (match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2]) || '';
      cols.push(val.trim());
      if (regex.lastIndex === line.length) break;
    }

    if (cols.length < 2) {
      errors.push(`Dòng ${i + 1}: Không đủ cột (cần ít nhất word, meaning)`);
      continue;
    }

    const word = cols[0];
    const meaning = cols[1];
    const example = cols[2] || '';
    const pronunciation = cols[3] || '';
    const part_of_speech = cols[4] || '';

    if (!word || !meaning) {
      errors.push(`Dòng ${i + 1}: Từ hoặc nghĩa bị thiếu`);
      continue;
    }

    if (existingWords.has(word.toLowerCase())) {
      continue; // Skip duplicate word
    }

    const newItem: VocabularyItem = {
      id: 'csv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      word,
      meaning,
      example,
      pronunciation,
      part_of_speech,
      status: 'new',
      english_to_vietnamese: createInitialDirectionSRS(),
      vietnamese_to_english: createInitialDirectionSRS(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    currentList.push(newItem);
    existingWords.add(word.toLowerCase());
    added++;
  }

  saveVocabulary(currentList);
  return { added, errors };
}

/**
 * Imports words from JSON or raw text
 */
export function importFromRawText(rawText: string): { added: number; errors: string[] } {
  // First, check if valid JSON
  try {
    const parsed = JSON.parse(rawText);
    if (Array.isArray(parsed)) {
      const currentList = loadVocabulary();
      const existingWords = new Set(currentList.map(w => w.word.toLowerCase()));
      let added = 0;

      for (const item of parsed) {
        const word = item.word || item.word_phrase;
        const meaning = item.meaning || item.meaning_vi;
        if (!word || !meaning) continue;
        if (existingWords.has(word.toLowerCase())) continue;

        currentList.push({
          id: 'json-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          word,
          meaning,
          pronunciation: item.pronunciation || '',
          part_of_speech: item.part_of_speech || item.pos || '',
          example: item.example || item.source_example || item.writing_example || '',
          notes: item.usage_note || item.notes || '',
          topics: item.topics || [],
          collocations: item.collocations || item.source_collocations || [],
          status: 'new',
          english_to_vietnamese: createInitialDirectionSRS(),
          vietnamese_to_english: createInitialDirectionSRS(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        existingWords.add(word.toLowerCase());
        added++;
      }
      saveVocabulary(currentList);
      return { added, errors: [] };
    }
  } catch {
    // Not JSON, continue to raw line parser
  }

  // Parse line format: "abandon - từ bỏ - They abandoned the project" or "abandon : từ bỏ"
  const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0);
  const currentList = loadVocabulary();
  const existingWords = new Set(currentList.map(w => w.word.toLowerCase()));
  let added = 0;
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(/[-–—:|]/).map(s => s.trim());
    if (parts.length >= 2) {
      const word = parts[0];
      const meaning = parts[1];
      const example = parts[2] || '';
      if (!word || !meaning) continue;
      if (existingWords.has(word.toLowerCase())) continue;

      currentList.push({
        id: 'paste-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        word,
        meaning,
        example,
        status: 'new',
        english_to_vietnamese: createInitialDirectionSRS(),
        vietnamese_to_english: createInitialDirectionSRS(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      existingWords.add(word.toLowerCase());
      added++;
    } else {
      errors.push(`Dòng ${i + 1}: Không tìm thấy dấu phân cách (- hoặc :)`);
    }
  }

  saveVocabulary(currentList);
  return { added, errors };
}

export function exportVocabularyJSON(): string {
  const list = loadVocabulary();
  return JSON.stringify(list, null, 2);
}

export function exportVocabularyCSV(): string {
  const list = loadVocabulary();
  const headers = ['word', 'meaning', 'pronunciation', 'part_of_speech', 'example', 'status', 'en_accuracy', 'vi_accuracy'];
  const rows = list.map(item => [
    `"${item.word.replace(/"/g, '""')}"`,
    `"${item.meaning.replace(/"/g, '""')}"`,
    `"${(item.pronunciation || '').replace(/"/g, '""')}"`,
    `"${(item.part_of_speech || '').replace(/"/g, '""')}"`,
    `"${(item.example || '').replace(/"/g, '""')}"`,
    item.status,
    `${item.english_to_vietnamese.accuracy}%`,
    `${item.vietnamese_to_english.accuracy}%`,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Gathers aggregate statistics for Dashboard
 */
export function getDashboardStats(): DashboardStats {
  const vocab = loadVocabulary();
  const now = new Date();

  const statusCounts = {
    new: 0,
    learning: 0,
    review: 0,
    mastered: 0,
  };

  let totalDueReviews = 0;
  let enCorrect = 0;
  let enTotal = 0;
  let viCorrect = 0;
  let viTotal = 0;

  for (const item of vocab) {
    statusCounts[item.status]++;

    const enDue = isDue(item.english_to_vietnamese, now);
    const viDue = isDue(item.vietnamese_to_english, now);
    if (enDue || viDue) {
      totalDueReviews++;
    }

    enCorrect += item.english_to_vietnamese.correctCount;
    enTotal += item.english_to_vietnamese.correctCount + item.english_to_vietnamese.incorrectCount;

    viCorrect += item.vietnamese_to_english.correctCount;
    viTotal += item.vietnamese_to_english.correctCount + item.vietnamese_to_english.incorrectCount;
  }

  const enAccuracy = enTotal > 0 ? Math.round((enCorrect / enTotal) * 100) : 0;
  const viAccuracy = viTotal > 0 ? Math.round((viCorrect / viTotal) * 100) : 0;
  const allReviewsDone = enTotal + viTotal;
  const overallAccuracy = allReviewsDone > 0 ? Math.round(((enCorrect + viCorrect) / allReviewsDone) * 100) : 0;

  const streakInfo = getStreakInfo();
  const todayReviewed = getTodayReviewedCount();

  return {
    todayTotalDue: Math.min(statusCounts.new, 10) + totalDueReviews + Math.min(statusCounts.review + statusCounts.mastered, 5),
    todayDueReviews: totalDueReviews,
    todayNewWords: Math.min(statusCounts.new, 10),
    todayCumulativeCount: Math.min(statusCounts.review + statusCounts.mastered, 5),
    totalWords: vocab.length,
    statusCounts,
    streakDays: streakInfo.streak,
    lastActiveDate: streakInfo.lastActiveDate,
    overallAccuracy,
    enToViAccuracy: enAccuracy,
    viToEnAccuracy: viAccuracy,
    totalReviewsDone: allReviewsDone,
    masteredCount: statusCounts.mastered,
    todayReviewedCount: todayReviewed,
  };
}
