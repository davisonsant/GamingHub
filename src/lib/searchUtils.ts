// Advanced search utilities for fuzzy and normalized game title matching

export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents/diacritics
    .trim();
}

export function cleanPunctuation(text: string): string {
  return normalizeText(text)
    .replace(/['"’`]/g, '') // remove apostrophes: Assassin's -> Assassins
    .replace(/[^a-z0-9]/g, ' ') // replace symbols and punctuation with space
    .replace(/\s+/g, ' ')
    .trim();
}

export function compactAlphanumeric(text: string): string {
  return normalizeText(text).replace(/[^a-z0-9]/g, '');
}

const ROMAN_NUMERALS: Record<string, string> = {
  i: '1',
  ii: '2',
  iii: '3',
  iv: '4',
  v: '5',
  vi: '6',
  vii: '7',
  viii: '8',
  ix: '9',
  x: '10',
};

const NUMBER_TO_ROMAN: Record<string, string> = {
  '1': 'i',
  '2': 'ii',
  '3': 'iii',
  '4': 'iv',
  '5': 'v',
  '6': 'vi',
  '7': 'vii',
  '8': 'viii',
  '9': 'ix',
  '10': 'x',
};

export function normalizeRomanNumerals(text: string): string {
  const words = text.split(/\s+/);
  return words
    .map(w => ROMAN_NUMERALS[w] || w)
    .join(' ');
}

export function normalizeNumbersToRoman(text: string): string {
  const words = text.split(/\s+/);
  return words
    .map(w => NUMBER_TO_ROMAN[w] || w)
    .join(' ');
}

export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
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
  return matrix[b.length][a.length];
}

export function stringSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(a, b);
  return 1 - dist / maxLen;
}

function isWordMatch(qw: string, tw: string): boolean {
  if (!qw || !tw) return false;
  if (tw === qw) return true;
  if (tw.startsWith(qw) || tw.includes(qw) || qw.includes(tw)) return true;
  if (qw.length < 3) return false;

  const maxDistance = qw.length <= 4 ? 1 : qw.length <= 7 ? 2 : 3;
  const dist = levenshteinDistance(qw, tw);
  if (dist <= maxDistance) return true;

  return stringSimilarity(qw, tw) >= 0.68;
}

/**
 * Checks if a game title matches a search query using fuzzy matching,
 * accent normalization, symbol cleaning, roman numeral handling, and typo tolerance.
 */
export function matchesGameTitle(rawTitle: string, rawQuery: string): boolean {
  if (!rawQuery || !rawQuery.trim()) return true;
  if (!rawTitle) return false;

  const queryNorm = normalizeText(rawQuery);
  const titleNorm = normalizeText(rawTitle);

  // 1. Direct standard substring
  if (titleNorm.includes(queryNorm)) return true;

  // 2. Cleaned punctuation substring
  const titleClean = cleanPunctuation(rawTitle);
  const queryClean = cleanPunctuation(rawQuery);
  if (titleClean.includes(queryClean)) return true;

  // 3. Compact alphanumeric match (e.g. "spider man" vs "spiderman", "007firstlight" vs "007 first light")
  const titleCompact = compactAlphanumeric(rawTitle);
  const queryCompact = compactAlphanumeric(rawQuery);
  if (queryCompact && titleCompact.includes(queryCompact)) return true;

  // 4. Roman numeral & number normalization matching (e.g. "Dragon's Dogma 2" vs "Dragon's Dogma II")
  const titleRomanNorm = normalizeRomanNumerals(titleClean);
  const queryRomanNorm = normalizeRomanNumerals(queryClean);
  if (titleRomanNorm.includes(queryRomanNorm)) return true;

  const titleNumToRoman = normalizeNumbersToRoman(titleClean);
  const queryNumToRoman = normalizeNumbersToRoman(queryClean);
  if (titleNumToRoman.includes(queryNumToRoman)) return true;

  // 5. Word-by-word fuzzy matching
  const queryWords = queryClean.split(/\s+/).filter(Boolean);
  const titleWords = titleClean.split(/\s+/).filter(Boolean);
  const titleRomanWords = titleRomanNorm.split(/\s+/).filter(Boolean);

  if (queryWords.length > 0) {
    const allWordsMatch = queryWords.every(qw => {
      const qwRoman = ROMAN_NUMERALS[qw] || qw;
      return (
        titleWords.some(tw => isWordMatch(qw, tw)) ||
        titleRomanWords.some(tw => isWordMatch(qwRoman, tw)) ||
        titleClean.includes(qw)
      );
    });
    if (allWordsMatch) return true;
  }

  // 6. Sliding window / phrase fuzzy similarity for typos (query >= 3 chars)
  if (queryClean.length >= 3) {
    // If title has similar length, check full string similarity
    const wholeSim = stringSimilarity(queryClean, titleClean);
    if (wholeSim >= 0.70) return true;

    // Check sliding window across title word sequences
    const qLen = queryWords.length;
    if (qLen > 0 && titleWords.length >= qLen) {
      for (let i = 0; i <= titleWords.length - qLen; i++) {
        const slice = titleWords.slice(i, i + qLen).join(' ');
        const sim = stringSimilarity(queryClean, slice);
        if (sim >= 0.72) return true;
      }
    }
  }

  return false;
}
