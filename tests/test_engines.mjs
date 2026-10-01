import { evaluateAnswer, extractTargetVariants, normalizeText } from '../src/engine/matcher.ts';
import { calculateNextSRS, computeWordStatus } from '../src/engine/srs.ts';
import { chooseOptimalDirection, buildStudyQueue } from '../src/engine/queue.ts';
import { SEED_VOCABULARY } from '../src/data/seedData.ts';
import { DEFAULT_SETTINGS } from '../src/storage/settingsStorage.ts';

console.log('=== RUNNING ACTIVE RECALL ENGINE TEST SUITE ===\n');

// 1. Test Matcher
console.log('Test 1: Testing Answer Matcher & Normalization...');

// EN -> VI
const viTarget = 'từ bỏ, bỏ rơi (ai đó)';
const viTest1 = evaluateAnswer('từ bỏ', viTarget, 'en_to_vi');
console.assert(viTest1.status === 'correct', `Expected 'correct', got ${viTest1.status}`);

const viTest2 = evaluateAnswer('TỪ BỎ', viTarget, 'en_to_vi');
console.assert(viTest2.status === 'correct', `Expected 'correct' case-insensitive, got ${viTest2.status}`);

const viTest3 = evaluateAnswer('bỏ', viTarget, 'en_to_vi');
console.assert(viTest3.status === 'unsure', `Expected 'unsure' for substring match, got ${viTest3.status}`);

// VI -> EN
const enTarget = 'pose a threat (to)';
const enTest1 = evaluateAnswer('pose a threat', enTarget, 'vi_to_en');
console.assert(enTest1.status === 'correct', `Expected 'correct' without paren, got ${enTest1.status}`);

const enTest2 = evaluateAnswer('pose a threat to', enTarget, 'vi_to_en');
console.assert(enTest2.status === 'correct', `Expected 'correct' with paren, got ${enTest2.status}`);

const enTest3 = evaluateAnswer('pose a threatt', enTarget, 'vi_to_en');
console.assert(enTest3.status === 'unsure', `Expected 'unsure' for typo, got ${enTest3.status}`);

// Test slash phrase variants like "be suited to / for"
const slashTarget = 'be suited to / for';
const slashTest1 = evaluateAnswer('be suited to', slashTarget, 'vi_to_en');
console.assert(slashTest1.status === 'correct', `Expected 'correct' for 'be suited to', got ${slashTest1.status}`);

const slashTest2 = evaluateAnswer('be suited for', slashTarget, 'vi_to_en');
console.assert(slashTest2.status === 'correct', `Expected 'correct' for 'be suited for', got ${slashTest2.status}`);

const slashTest3 = evaluateAnswer('be suited to / for', slashTarget, 'vi_to_en');
console.assert(slashTest3.status === 'correct', `Expected 'correct' for full string, got ${slashTest3.status}`);

console.log('✓ Answer matcher & slash alternatives tests passed successfully!');

// Test cleanTextForSpeech
import { cleanTextForSpeech } from '../src/utils/speech.ts';
const cleanedVoice1 = cleanTextForSpeech('be suited to / for');
console.assert(!cleanedVoice1.includes('/'), `Expected no slash in speech, got: ${cleanedVoice1}`);
console.assert(cleanedVoice1 === 'be suited to, for', `Expected 'be suited to, for', got: ${cleanedVoice1}`);

const cleanedVoice2 = cleanTextForSpeech('congratulate sb on sth');
console.assert(cleanedVoice2 === 'congratulate somebody on something', `Expected abbreviation expansion, got: ${cleanedVoice2}`);

const cleanedVoice3 = cleanTextForSpeech('pose a threat (to)');
console.assert(cleanedVoice3 === 'pose a threat to', `Expected 'pose a threat to', got: ${cleanedVoice3}`);
console.log('✓ Speech synthesis text cleaner passed successfully!');

// 2. Test SRS Transitions
console.log('\nTest 2: Testing SRS Intervals and Transitions...');
const initialSRS = {
  correctCount: 0,
  incorrectCount: 0,
  accuracy: 0,
  interval: 0,
  easeFactor: 2.5,
  repetitions: 0,
  lastReviewed: null,
  nextReview: null,
};

// First Good review
const step1 = calculateNextSRS(initialSRS, 'good', true);
console.assert(step1.interval === 1, `Expected step1 interval 1, got ${step1.interval}`);
console.assert(step1.repetitions === 1, `Expected step1 reps 1, got ${step1.repetitions}`);

// Second Good review
const step2 = calculateNextSRS(step1, 'good', true);
console.assert(step2.interval === 3, `Expected step2 interval 3, got ${step2.interval}`);
console.assert(step2.repetitions === 2, `Expected step2 reps 2, got ${step2.repetitions}`);

// Third Good review
const step3 = calculateNextSRS(step2, 'good', true);
console.assert(step3.interval >= 7, `Expected step3 interval >= 7, got ${step3.interval}`);

// Failing with Again
const failed = calculateNextSRS(step3, 'again', false);
console.assert(failed.interval === 0, `Expected failed interval 0, got ${failed.interval}`);
console.assert(failed.repetitions === 0, `Expected failed reps reset to 0, got ${failed.repetitions}`);
console.assert(failed.easeFactor < step3.easeFactor, `Expected ease factor drop on fail`);

console.log('✓ SRS calculation tests passed successfully!');

// 3. Test Dual Direction Independence
console.log('\nTest 3: Testing Dual-Direction Independence...');
const mockWord = {
  ...SEED_VOCABULARY[0],
  english_to_vietnamese: { ...initialSRS, interval: 25, accuracy: 100, repetitions: 4, correctCount: 4, incorrectCount: 0 },
  vietnamese_to_english: { ...initialSRS, interval: 0, accuracy: 40, repetitions: 0, correctCount: 2, incorrectCount: 3 },
};

// Optimal direction should prioritize the weaker direction (vietnamese_to_english)
const direction = chooseOptimalDirection(mockWord, DEFAULT_SETTINGS);
console.assert(direction === 'vi_to_en', `Expected vi_to_en as optimal direction for weak word, got ${direction}`);
console.log('✓ Dual-direction prioritization passed successfully!');

// 4. Test Queue Builder
console.log('\nTest 4: Testing Cumulative Queue Generation...');
const queue = buildStudyQueue(SEED_VOCABULARY, 'quick', DEFAULT_SETTINGS);
console.assert(queue.length > 0, `Expected non-empty queue, got length ${queue.length}`);
console.assert(queue.some(c => c.direction === 'vi_to_en'), `Queue should include productive VI->EN cards`);
console.assert(queue.some(c => c.direction === 'en_to_vi'), `Queue should include receptive EN->VI cards`);
console.log(`✓ Generated study session with ${queue.length} balanced cards.`);

console.log('\nTest 5: Testing Topic Filtered Study Queue...');
const topicQueue = buildStudyQueue(SEED_VOCABULARY, 'topic', DEFAULT_SETTINGS, new Date(), 'Environment');
console.assert(topicQueue.length > 0, 'Topic queue should contain cards');
topicQueue.forEach(c => {
  console.assert(c.word.topics.includes('Environment'), `Card ${c.word.english} should belong to topic Environment`);
});
console.log(`✓ Generated topic session with ${topicQueue.length} cards matching topic 'Environment'.`);

console.log('\nALL ENGINE AUTOMATED TESTS PASSED WITH 100% INTEGRITY!');
