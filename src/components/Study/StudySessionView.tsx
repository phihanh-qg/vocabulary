import React, { useState, useEffect, useRef } from 'react';
import { ReviewRating, StudyCard, VocabularyItem } from '../../types';
import { evaluateAnswer, MatchResult } from '../../engine/matcher';
import { calculateNextSRS, computeWordStatus } from '../../engine/srs';
import { appendReviewLog } from '../../storage/historyStorage';
import { updateVocabularyWord } from '../../storage/vocabStorage';
import { playPronunciation } from '../../utils/speech';
import { 
  playCorrectSound, 
  playUnsureSound, 
  playIncorrectSound, 
  playCelebrationSound 
} from '../../utils/soundEffects';

interface StudySessionViewProps {
  cards: StudyCard[];
  onFinishSession: () => void;
  onExitSession: () => void;
}

export const StudySessionView: React.FC<StudySessionViewProps> = ({
  cards,
  onFinishSession,
  onExitSession,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [cardStartTime, setCardStartTime] = useState<number>(Date.now());

  const inputRef = useRef<HTMLInputElement>(null);

  const currentCard = cards[currentIndex];
  const isLastCard = currentIndex === cards.length - 1;

  // Auto-focus input and cleanly reset IME buffer when a new card arrives
  useEffect(() => {
    setUserAnswer('');
    setIsAnswered(false);
    setMatchResult(null);
    setCardStartTime(Date.now());

    // Clean DOM input directly and reset selection to ensure IME buffer synchronization
    if (inputRef.current) {
      inputRef.current.value = '';
    }

    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(0, 0);
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  const word = currentCard?.word;
  const isViToEn = currentCard?.direction === 'vi_to_en';
  const promptTitle = isViToEn ? word?.meaning : word?.word;
  const targetAnswer = isViToEn ? word?.word : word?.meaning;

  const answeredAtRef = useRef<number>(0);

  const handleSubmitAnswer = () => {
    if (!userAnswer.trim() || !targetAnswer || !word || !currentCard) return;

    const evaluation = evaluateAnswer(userAnswer, targetAnswer, currentCard.direction);
    setMatchResult(evaluation);
    setIsAnswered(true);
    answeredAtRef.current = Date.now();

    // Explicitly blur the input on submit to notify OS / EVKey that editing is complete
    inputRef.current?.blur();

    if (evaluation.status === 'correct') {
      playCorrectSound();
    } else if (evaluation.status === 'unsure') {
      playUnsureSound();
    } else {
      playIncorrectSound();
    }

    playPronunciation(word.word);
  };

  const handleRevealStuck = () => {
    if (!word) return;
    setMatchResult({
      status: 'incorrect',
      feedback: 'Đã hiện đáp án để học lại. Hãy xem kỹ và đánh giá "Quên".',
      isExact: false,
    });
    setIsAnswered(true);
    answeredAtRef.current = Date.now();
    inputRef.current?.blur();
    playIncorrectSound();
    playPronunciation(word.word);
  };

  const handleSelectRating = (rating: ReviewRating) => {
    if (!word || !currentCard || !targetAnswer) return;
    const responseTime = Date.now() - cardStartTime;
    const isCorrect = matchResult?.status === 'correct' || (matchResult?.status === 'unsure' && rating !== 'again');

    const currentDirectionSRS = isViToEn ? word.vietnamese_to_english : word.english_to_vietnamese;
    const updatedSRS = calculateNextSRS(currentDirectionSRS, rating, isCorrect);

    const updatedWord: VocabularyItem = {
      ...word,
      english_to_vietnamese: isViToEn ? word.english_to_vietnamese : updatedSRS,
      vietnamese_to_english: isViToEn ? updatedSRS : word.vietnamese_to_english,
    };
    updatedWord.status = computeWordStatus(updatedWord);

    updateVocabularyWord(updatedWord);

    appendReviewLog({
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      word_id: word.id,
      word: word.word,
      direction: currentCard.direction,
      user_answer: userAnswer || '(Không nhập - xem đáp án)',
      correct_answer: targetAnswer,
      result: matchResult?.status || 'incorrect',
      rating,
      response_time_ms: responseTime,
      reviewed_at: new Date().toISOString(),
    });

    if (isLastCard) {
      playCelebrationSound();
      onFinishSession();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // Stable references for global keyboard shortcuts to prevent event listener churn
  const isAnsweredRef = useRef(isAnswered);
  isAnsweredRef.current = isAnswered;

  const matchResultRef = useRef(matchResult);
  matchResultRef.current = matchResult;

  const handleSubmitRef = useRef(handleSubmitAnswer);
  handleSubmitRef.current = handleSubmitAnswer;

  const handleRevealRef = useRef(handleRevealStuck);
  handleRevealRef.current = handleRevealStuck;

  const handleRatingRef = useRef(handleSelectRating);
  handleRatingRef.current = handleSelectRating;

  // Handle keyboard shortcuts with IME composition awareness and debounce
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept while Vietnamese IME (EVKey/Unikey/Telex) is composing
      if (e.isComposing || e.keyCode === 229) {
        return;
      }

      if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      if (!isAnsweredRef.current) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSubmitRef.current();
        } else if (e.key === ' ' && e.ctrlKey) {
          e.preventDefault();
          handleRevealRef.current();
        }
      } else {
        // Cooldown: prevent the same Enter key press or fast double-tap from skipping the feedback screen
        if (Date.now() - answeredAtRef.current < 450) {
          return;
        }

        if (e.key === '1') {
          e.preventDefault();
          handleRatingRef.current('again');
        } else if (e.key === '2') {
          e.preventDefault();
          handleRatingRef.current('hard');
        } else if (e.key === '3') {
          e.preventDefault();
          handleRatingRef.current('good');
        } else if (e.key === '4') {
          e.preventDefault();
          handleRatingRef.current('easy');
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (matchResultRef.current?.status === 'correct') {
            handleRatingRef.current('good');
          } else {
            handleRatingRef.current('again');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!currentCard || !word) {
    return null;
  }

  const progressPercentage = Math.round(((currentIndex + 1) / cards.length) * 100);

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 space-y-5">
      
      {/* Top Header: Progress & Close */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
            {currentIndex + 1} / {cards.length}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {currentCard.reason === 'due' && 'Đến hạn'}
            {currentCard.reason === 'new' && 'Từ mới'}
            {currentCard.reason === 'weak' && 'Cần củng cố'}
            {currentCard.reason === 'cumulative' && 'Ôn tích lũy'}
          </span>
        </div>

        {/* Direction Tag Badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
          isViToEn 
            ? 'bg-blue-50 text-blue-700 border-blue-200' 
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          {isViToEn ? 'Việt → Anh (Productive Recall)' : 'Anh → Việt (Nhận diện)'}
        </div>

        <button
          onClick={onExitSession}
          className="text-xs px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
        >
          Thoát
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
        <div 
          style={{ width: `${progressPercentage}%` }}
          className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
        />
      </div>

      {/* Main Study Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm space-y-8 min-h-[380px] flex flex-col justify-between">
        
        {/* Question Area */}
        <div className="text-center space-y-3 pt-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {isViToEn ? 'Nhớ từ tiếng Anh của nghĩa này:' : 'Nhớ nghĩa tiếng Việt của từ:'}
          </span>
          
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {promptTitle}
            </h2>
            {!isViToEn && (
              <button
                onClick={() => playPronunciation(word.word)}
                className="text-slate-400 hover:text-emerald-700 p-1.5 rounded-full hover:bg-slate-100 transition"
                title="Nghe phát âm"
              >
                🔊
              </button>
            )}
          </div>

          {!isViToEn && word.pronunciation && (
            <p className="text-sm font-mono text-slate-500">
              {word.pronunciation} • <span className="italic">{word.part_of_speech}</span>
            </p>
          )}

          {isViToEn && word.part_of_speech && (
            <p className="text-xs text-slate-500 font-medium">
              Từ loại: <span className="text-slate-700">{word.part_of_speech}</span>
            </p>
          )}
        </div>

        {/* Center: Input (Permanently mounted in DOM to prevent IME / EVKey de-sync) */}
        <div className="space-y-4 max-w-md mx-auto w-full">
          <div>
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isAnswered) {
                    handleSubmitAnswer();
                  }
                }
              }}
              readOnly={isAnswered}
              lang={isViToEn ? 'en' : 'vi'}
              placeholder={isViToEn ? "Gõ từ tiếng Anh..." : "Gõ nghĩa tiếng Việt..."}
              className={`w-full px-5 py-3.5 border-2 rounded-xl text-lg font-medium outline-none transition text-center shadow-sm ${
                isAnswered
                  ? matchResult?.status === 'correct'
                    ? 'bg-emerald-50/70 border-emerald-500 text-emerald-950 font-bold'
                    : matchResult?.status === 'unsure'
                      ? 'bg-amber-50/70 border-amber-500 text-amber-950 font-bold'
                      : 'bg-rose-50/70 border-rose-400 text-rose-950 font-bold'
                  : 'bg-slate-50 border-slate-300 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 text-slate-900 placeholder-slate-400'
              }`}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck="false"
            />
          </div>

          {!isAnswered ? (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRevealStuck}
                className="text-xs text-slate-400 hover:text-slate-600 underline py-2 transition"
              >
                Quên? Xem đáp án
              </button>

              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={!userAnswer.trim()}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-sm transition text-sm"
              >
                Kiểm tra (↵ Enter)
              </button>
            </div>
          ) : (
            /* Answer Revealed & Feedback */
            <div className="space-y-4 animate-fadeIn">
              {/* Status Banner */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                matchResult?.status === 'correct'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : matchResult?.status === 'unsure'
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}>
                <div className="space-y-0.5">
                  <div className="font-bold text-base flex items-center gap-2">
                    {matchResult?.status === 'correct' && <span className="text-emerald-700">✅ Đúng rồi!</span>}
                    {matchResult?.status === 'unsure' && <span className="text-amber-700">⚠️ Gần đúng!</span>}
                    {matchResult?.status === 'incorrect' && <span className="text-rose-700">❌ Chưa chính xác!</span>}
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    {matchResult?.feedback}
                  </div>
                </div>
                {userAnswer && (
                  <div className="text-xs text-slate-500 bg-white/80 px-3 py-1.5 rounded-lg border border-slate-200/80 self-start sm:self-auto">
                    Bạn đã gõ: <span className="font-bold text-slate-800">"{userAnswer}"</span>
                  </div>
                )}
              </div>

              {/* Target Canonical Answer */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Đáp án chính xác:
                  </span>
                  <button
                    type="button"
                    onClick={() => playPronunciation(word.word)}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                  >
                    🔊 Nghe phát âm
                  </button>
                </div>

                <div className="text-xl font-bold text-slate-900">
                  {targetAnswer}
                </div>

                {word.pronunciation && (
                  <div className="text-xs font-mono text-slate-500">
                    {word.pronunciation} • <span className="italic">{word.part_of_speech}</span>
                  </div>
                )}

                {word.example && (
                  <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-700 block mb-0.5">Ví dụ:</span>
                    <p className="italic">"{word.example}"</p>
                  </div>
                )}
              </div>

              {/* SRS Rating Buttons */}
              <div className="space-y-2 pt-1">
                <div className="text-center text-xs text-slate-500 font-medium">
                  Đánh giá mức độ ghi nhớ (phím tắt 1 - 4 hoặc Enter):
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectRating('again')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-semibold transition"
                  >
                    <span className="text-xs text-rose-600 font-mono mb-0.5">1 • 10 phút</span>
                    <span className="text-sm">Quên</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRating('hard')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-semibold transition"
                  >
                    <span className="text-xs text-amber-600 font-mono mb-0.5">2 • 1 ngày</span>
                    <span className="text-sm">Khó nhớ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRating('good')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold transition shadow-sm"
                  >
                    <span className="text-xs text-emerald-600 font-mono mb-0.5">3 • 3 ngày</span>
                    <span className="text-sm">Nhớ tốt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRating('easy')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-semibold transition"
                  >
                    <span className="text-xs text-blue-600 font-mono mb-0.5">4 • 7+ ngày</span>
                    <span className="text-sm">Rất dễ</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div>
            {!isAnswered ? (
              <span>Nhấn <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600 font-mono">Enter</kbd> để kiểm tra</span>
            ) : (
              <span>Phím <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600 font-mono">1</kbd> <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600 font-mono">2</kbd> <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600 font-mono">3</kbd> <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600 font-mono">4</kbd></span>
            )}
          </div>
          <div>Active Retrieval Practice</div>
        </div>

      </div>

    </div>
  );
};
