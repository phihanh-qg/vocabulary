/**
 * Cleans text for natural English speech synthesis.
 * Removes slashes, expands standard dictionary abbreviations,
 * and strips special punctuation so the voice never pronounces "slash" or symbols.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Expand standard English dictionary abbreviations
  cleaned = cleaned
    .replace(/\bsb\/sth\b/gi, 'somebody or something')
    .replace(/\bhe\/she\b/gi, 'he or she')
    .replace(/\band\/or\b/gi, 'and or')
    .replace(/\bsb\.?\b/gi, 'somebody')
    .replace(/\bsth\.?\b/gi, 'something')
    .replace(/\bsw\.?\b/gi, 'somewhere');

  // 2. Handle slashes without saying "slash":
  // Replace " / " or "/" with a comma and space so the TTS pauses naturally
  cleaned = cleaned.replace(/\s*\/\s*/g, ', ');

  // 3. Remove metadata in parentheses like (formal), (verb), etc.
  cleaned = cleaned.replace(/\((formal|informal|academic|v|n|adj|adv|prep)\)/gi, ' ');

  // 4. Remove parentheses brackets but keep the content inside e.g. "pose a threat (to)" -> "pose a threat to"
  cleaned = cleaned.replace(/[()[\]{}]/g, ' ');

  // 5. Clean symbols that TTS might read aloud as words:
  // e.g. "~", "_", "*", "#", "@", "+", "="
  cleaned = cleaned
    .replace(/\.{3,}/g, ', ') // Ellipses "..." -> short pause
    .replace(/[~_*#@+=]/g, ' ')
    .replace(/\s+-\s+/g, ', '); // Standalone dash -> pause

  // 6. Clean up trailing/duplicate commas and spaces
  cleaned = cleaned
    .replace(/,\s*,+/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove leading or trailing commas
  cleaned = cleaned.replace(/^,\s*/, '').replace(/,\s*$/, '');

  return cleaned;
}

/**
 * Uses the browser's Web Speech API for instant native English pronunciation.
 */
export function playPronunciation(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const spokenText = cleanTextForSpeech(text);
    if (!spokenText) return;

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // Clear pace for learners

    // Attempt to pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => (v.lang === 'en-US' || v.lang.startsWith('en')) && !v.name.includes('Google') && v.localService) 
      || voices.find(v => v.lang.startsWith('en'));
    if (enVoice) {
      utterance.voice = enVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Speech synthesis error:', err);
  }
}
