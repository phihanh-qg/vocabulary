export interface MatchResult {
  status: 'correct' | 'incorrect' | 'unsure';
  feedback: string;
  isExact: boolean;
}

/**
 * Standardize text by lowercasing, trimming, and normalizing whitespace & punctuation.
 */
export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips Vietnamese diacritics for phonetic or base-word comparison.
 */
export function stripVietnameseDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd');
}

/**
 * Calculates Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix: number[][] = [];
  for (let i = 0; i <= bn; ++i) matrix[i] = [i];
  for (let i = 0; i <= an; ++i) matrix[0][i] = i;

  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Intelligently expands slash alternative phrases like "be suited to / for"
 * into ["be suited to", "be suited for", "be suited to for"].
 */
export function expandSlashAlternatives(phrase: string): string[] {
  if (!phrase.includes('/')) {
    return [phrase];
  }

  const results = new Set<string>();

  // 1. Check if slash separates word alternatives e.g. "be suited to / for" or "financial / practical constraints"
  const slashMatch = phrase.match(/^(.*?)\b([\p{L}\p{N}'-]+)\s*\/\s*([\p{L}\p{N}'-]+)\b(.*?)$/u);
  if (slashMatch) {
    const [, before, wordA, wordB, after] = slashMatch;
    const optionA = `${before}${wordA}${after}`.trim();
    const optionB = `${before}${wordB}${after}`.trim();
    if (optionA) results.add(optionA);
    if (optionB) results.add(optionB);
  }

  // 2. Also split by slash as distinct phrases e.g. "từ bỏ / buông bỏ"
  const rawParts = phrase.split('/').map(p => p.trim()).filter(Boolean);
  for (const p of rawParts) {
    if (p) results.add(p);
  }

  // 3. Whole phrase with slash replaced by space
  results.add(phrase.replace(/\//g, ' ').trim());

  return Array.from(results);
}

/**
 * Extracts possible acceptable answer variations from a target string.
 * Example 1: "từ bỏ, bỏ rơi (ai đó)" -> ["từ bỏ", "bỏ rơi", "bỏ rơi ai đó"]
 * Example 2: "pose a threat (to)" -> ["pose a threat", "pose a threat to"]
 * Example 3: "be suited to / for" -> ["be suited to", "be suited for", "be suited to for"]
 */
export function extractTargetVariants(target: string): string[] {
  // First split by commas, semicolons, newlines
  const rawChunks = target.split(/[,;\n]/).map(p => p.trim()).filter(Boolean);
  const variants = new Set<string>();

  for (const chunk of rawChunks) {
    // Expand slashes e.g. "be suited to / for" -> ["be suited to", "be suited for"]
    const expandedPhrases = expandSlashAlternatives(chunk);

    for (const phrase of expandedPhrases) {
      const normalized = normalizeText(phrase);
      if (normalized) {
        variants.add(normalized);
      }

      // If phrase contains parentheses e.g. "pose a threat (to)"
      if (phrase.includes('(') && phrase.includes(')')) {
        const withoutParen = normalizeText(phrase.replace(/\([^)]*\)/g, ' '));
        const withParenContent = normalizeText(phrase.replace(/[()]/g, ' '));
        if (withoutParen) variants.add(withoutParen);
        if (withParenContent) variants.add(withParenContent);
      }
    }
  }

  return Array.from(variants);
}

/**
 * Compares user response against target answer in both directions.
 */
export function evaluateAnswer(
  userAnswer: string,
  targetAnswer: string,
  direction: 'en_to_vi' | 'vi_to_en'
): MatchResult {
  const cleanUser = normalizeText(userAnswer);
  if (!cleanUser) {
    return {
      status: 'incorrect',
      feedback: 'Bạn chưa nhập câu trả lời.',
      isExact: false,
    };
  }

  const variants = extractTargetVariants(targetAnswer);

  // 1. Exact Match Check
  for (const variant of variants) {
    if (cleanUser === variant) {
      return {
        status: 'correct',
        feedback: '✓ Chính xác tuyệt đối!',
        isExact: true,
      };
    }
  }

  // 2. Direction-specific Heuristics
  if (direction === 'vi_to_en') {
    // English recall: check minor typo (Levenshtein distance 1 for length > 4, or 2 for length > 8)
    for (const variant of variants) {
      const dist = levenshtein(cleanUser, variant);
      if (
        (dist === 1 && variant.length >= 4) ||
        (dist === 2 && variant.length >= 8)
      ) {
        return {
          status: 'unsure',
          feedback: 'Có thể đúng (sai chính tả nhẹ). Hãy tự đánh giá.',
          isExact: false,
        };
      }
    }
  } else {
    // Vietnamese recall: check substring containment or diacritic-free matches
    const noDiacriticUser = stripVietnameseDiacritics(cleanUser);

    for (const variant of variants) {
      // Substring check: e.g. user typed "bỏ" when variant is "từ bỏ", or "gây đe dọa" when variant is "đe doạ"
      if (
        (variant.includes(cleanUser) && cleanUser.length >= 2) ||
        (cleanUser.includes(variant) && variant.length >= 2)
      ) {
        return {
          status: 'unsure',
          feedback: 'Có thể đúng (chứa từ tương đồng). Hãy tự đánh giá.',
          isExact: false,
        };
      }

      // Diacritic-free match
      const noDiacriticVariant = stripVietnameseDiacritics(variant);
      if (noDiacriticUser === noDiacriticVariant) {
        return {
          status: 'unsure',
          feedback: 'Đúng từ ngữ nhưng thiếu hoặc khác dấu thanh tiếng Việt. Hãy tự đánh giá.',
          isExact: false,
        };
      }
    }
  }

  // 3. Fallback: Incorrect
  return {
    status: 'incorrect',
    feedback: '✗ Chưa chính xác. Đừng nản, hãy xem kỹ đáp án bên dưới.',
    isExact: false,
  };
}
