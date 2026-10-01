import { VocabularyItem } from '../types';

export const COMMON_TOPICS = [
  'Environment',
  'Technology',
  'Society',
  'Economy',
  'Education',
  'Health',
  'Workplace',
  'General',
  'Psychology',
  'Governance',
  'Culture',
];

export interface TopicStat {
  name: string;
  count: number;
}

/**
 * Extracts and counts all unique topics from the vocabulary list
 */
export function getAllTopics(vocab: VocabularyItem[]): TopicStat[] {
  const map = new Map<string, number>();

  for (const item of vocab) {
    if (item.topics && Array.isArray(item.topics) && item.topics.length > 0) {
      for (const t of item.topics) {
        const trimmed = t.trim();
        if (trimmed) {
          map.set(trimmed, (map.get(trimmed) || 0) + 1);
        }
      }
    } else {
      map.set('General', (map.get('General') || 0) + 1);
    }
  }

  const list: TopicStat[] = [];
  map.forEach((count, name) => {
    list.push({ name, count });
  });

  return list.sort((a, b) => b.count - a.count);
}
