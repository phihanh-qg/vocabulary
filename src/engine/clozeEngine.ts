import { BlankingMode } from '../types';

export interface TokenItem {
  id: number;
  raw: string;
  cleanWord: string;
  prefix: string;
  suffix: string;
  isWord: boolean;
  isBlank: boolean;
  hintLetter: string;
}

// Common functional words that should typically not be blanked in easy/medium modes
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 
  'with', 'by', 'as', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'it', 'its', 'this', 'that', 'these', 'those', 'i', 'we', 'they', 'he', 'she',
  'my', 'our', 'their', 'his', 'her'
]);

/**
 * Splits paragraph text into words and punctuation tokens while keeping exact layout
 */
export function generateClozeTokens(
  content: string,
  mode: BlankingMode,
  keywords?: string[],
  seed: number = 0
): TokenItem[] {
  // Regex to split while retaining words with apostrophes (e.g., don't, it's) and punctuation
  const tokenRegex = /([a-zA-Z0-9'’]+|[^a-zA-Z0-9'’\s]+|\s+)/g;
  const rawParts: string[] = content.match(tokenRegex) || [content];

  const candidateIndices: number[] = [];
  const keywordSet = new Set((keywords || []).map(k => k.toLowerCase().trim()));

  const tokens: TokenItem[] = rawParts.map((part, index) => {
    // Check if this part is a word
    const wordMatch = part.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9'’]+)([^a-zA-Z0-9]*)$/);

    if (wordMatch) {
      const prefix = wordMatch[1] || '';
      const cleanWord = wordMatch[2] || '';
      const suffix = wordMatch[3] || '';

      // Only words with at least 2 letters qualify as blank candidates
      if (cleanWord.length >= 2) {
        candidateIndices.push(index);
      }

      return {
        id: index,
        raw: part,
        cleanWord,
        prefix,
        suffix,
        isWord: true,
        isBlank: false,
        hintLetter: cleanWord.charAt(0)
      };
    } else {
      return {
        id: index,
        raw: part,
        cleanWord: '',
        prefix: '',
        suffix: '',
        isWord: false,
        isBlank: false,
        hintLetter: ''
      };
    }
  });

  // Determine which tokens to blank out based on mode
  if (mode === 'all') {
    // Blank all words
    candidateIndices.forEach(idx => {
      tokens[idx].isBlank = true;
    });
  } else if (mode === 'keywords' && keywordSet.size > 0) {
    // Blank words matching keywords
    let blankedCount = 0;
    candidateIndices.forEach(idx => {
      const lower = tokens[idx].cleanWord.toLowerCase();
      if (keywordSet.has(lower)) {
        tokens[idx].isBlank = true;
        blankedCount++;
      }
    });

    // If keywords covered fewer than 20% of words, blank some additional important words
    if (blankedCount < Math.ceil(candidateIndices.length * 0.2)) {
      const remainingCandidates = candidateIndices.filter(
        idx => !tokens[idx].isBlank && !STOP_WORDS.has(tokens[idx].cleanWord.toLowerCase()) && tokens[idx].cleanWord.length > 3
      );
      const needed = Math.ceil(candidateIndices.length * 0.25) - blankedCount;
      const shuffled = pseudoShuffle(remainingCandidates, seed);
      for (let i = 0; i < Math.min(needed, shuffled.length); i++) {
        tokens[shuffled[i]].isBlank = true;
      }
    }
  } else {
    // Percentage-based blanking
    let ratio = 0.25; // default easy
    if (mode === 'easy') ratio = 0.20;
    else if (mode === 'medium') ratio = 0.35;
    else if (mode === 'hard') ratio = 0.50;

    // Prioritize non-stop words with length >= 3
    const nonStopCandidates = candidateIndices.filter(
      idx => !STOP_WORDS.has(tokens[idx].cleanWord.toLowerCase()) && tokens[idx].cleanWord.length >= 3
    );
    const otherCandidates = candidateIndices.filter(
      idx => !nonStopCandidates.includes(idx)
    );

    const targetCount = Math.max(1, Math.round(candidateIndices.length * ratio));
    const shuffledNonStop = pseudoShuffle(nonStopCandidates, seed);
    const shuffledOther = pseudoShuffle(otherCandidates, seed + 1);

    const toBlank = [...shuffledNonStop, ...shuffledOther].slice(0, targetCount);
    toBlank.forEach(idx => {
      tokens[idx].isBlank = true;
    });
  }

  return tokens;
}

/**
 * Deterministic pseudo-random shuffle based on an integer seed
 */
function pseudoShuffle<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  let m = arr.length;
  let s = seed + 1337;

  while (m) {
    s = (s * 9301 + 49297) % 233280;
    const rnd = s / 233280;
    const i = Math.floor(rnd * m--);
    const t = arr[m];
    arr[m] = arr[i];
    arr[i] = t;
  }

  return arr;
}
