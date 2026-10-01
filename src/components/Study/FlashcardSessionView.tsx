import React, { useState, useEffect } from 'react';
import { ReviewRating, StudyCard, VocabularyItem } from '../../types';
import { calculateNextSRS, computeWordStatus } from '../../engine/srs';
import { appendReviewLog } from '../../storage/historyStorage';
import { updateVocabularyWord } from '../../storage/vocabStorage';
import { playPronunciation } from '../../utils/speech';
import { 
  playCorrectSound, 
  playUnsureSound, 
  playIncorrectSound, 
  playCelebrationSound, 
  playCardFlipSound 
} from '../../utils/soundEffects';

interface FlashcardSessionViewProps {
  cards: StudyCard[];
  onFinishSession: () => void;
  onExitSession: () => void;
}

export const FlashcardSessionView: React.FC<FlashcardSessionViewProps> = ({
  cards,
  onFinishSession,
  onExitSession,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [directionMode, setDirectionMode] = useState<'auto' | 'en_first' | 'vi_first'>('auto');

  const currentCard = cards[currentIndex];
  const isLastCard = currentIndex === cards.length - 1;

  // Reset flip on new card
  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  const handleFlipCard = () => {
    playCardFlipSound();
    setIsFlipped(prev => !prev);
  };

  // Handle keyboard shortcuts: Space to flip, 1-4 for SRS rating, Arrows for prev/next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlipCard();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextCard();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevCard();
      } else if (e.key === '1') {
        e.preventDefault();
        handleRating('again');
      } else if (e.key === '2') {
        e.preventDefault();
        handleRating('hard');
      } else if (e.key === '3') {
        e.preventDefault();
        handleRating('good');
      } else if (e.key === '4') {
        e.preventDefault();
        handleRating('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFlipped, isLastCard]);

  if (!currentCard) return null;

  // Pronounce word when front shows English or when requested
  const handlePronounce = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPronunciation(word.word);
  };

  const word = currentCard.word;

  // Determine which side is front
  let showEnOnFront = true;
  if (directionMode === 'en_first') {
    showEnOnFront = true;
  } else if (directionMode === 'vi_first') {
    showEnOnFront = false;
  } else {
    // auto: follow card direction (if vi_to_en, front is vi; if en_to_vi, front is en)
    showEnOnFront = currentCard.direction === 'en_to_vi';
  }

  const frontTitle = showEnOnFront ? word.word : word.meaning;
  const backTitle = showEnOnFront ? word.meaning : word.word;

  const handleNextCard = () => {
    if (isLastCard) {
      playCelebrationSound();
      onFinishSession();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleRating = (rating: ReviewRating) => {
    if (rating === 'again') {
      playIncorrectSound();
    } else if (rating === 'hard') {
      playUnsureSound();
    } else {
      playCorrectSound();
    }

    const isCorrect = rating !== 'again';
    const direction = showEnOnFront ? 'en_to_vi' : 'vi_to_en';
    const currentDirectionSRS = direction === 'vi_to_en' ? word.vietnamese_to_english : word.english_to_vietnamese;
    const updatedSRS = calculateNextSRS(currentDirectionSRS, rating, isCorrect);

    const updatedWord: VocabularyItem = {
      ...word,
      english_to_vietnamese: direction === 'vi_to_en' ? word.english_to_vietnamese : updatedSRS,
      vietnamese_to_english: direction === 'vi_to_en' ? updatedSRS : word.vietnamese_to_english,
    };
    updatedWord.status = computeWordStatus(updatedWord);
    updateVocabularyWord(updatedWord);

    appendReviewLog({
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      word_id: word.id,
      word: word.word,
      direction,
      user_answer: '(Flashcard)',
      correct_answer: backTitle,
      result: isCorrect ? 'correct' : 'incorrect',
      rating,
      response_time_ms: 3000,
      reviewed_at: new Date().toISOString(),
    });

    handleNextCard();
  };

  const progressPercentage = Math.round(((currentIndex + 1) / cards.length) * 100);

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 space-y-5">
      
      {/* Top Controls */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-sm">
            {currentIndex + 1} / {cards.length}
          </span>
          <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
            Chế độ Flashcard
          </span>
        </div>

        {/* Direction Switcher */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
          <button
            onClick={() => setDirectionMode('auto')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
              directionMode === 'auto' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-500'
            }`}
          >
            Tự động
          </button>
          <button
            onClick={() => setDirectionMode('en_first')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
              directionMode === 'en_first' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-500'
            }`}
          >
            Anh trước
          </button>
          <button
            onClick={() => setDirectionMode('vi_first')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
              directionMode === 'vi_first' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-500'
            }`}
          >
            Việt trước
          </button>
        </div>

        <button
          onClick={onExitSession}
          className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition font-medium"
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

      {/* Main Flashcard */}
      <div
        onClick={handleFlipCard}
        className="bg-white border-2 border-slate-200 hover:border-slate-300 rounded-2xl p-8 sm:p-12 shadow-sm min-h-[380px] flex flex-col justify-between cursor-pointer transition select-none text-center relative group"
      >
        {/* Top Card Badge */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {word.topics && word.topics.length > 0 ? word.topics.join(' • ') : 'General'}
          </span>
          <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
            {!isFlipped ? 'Mặt trước (Nhấp để lật thẻ)' : 'Mặt sau'}
          </span>
        </div>

        {/* Center Content */}
        {!isFlipped ? (
          /* FRONT OF CARD */
          <div className="space-y-3 py-8">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              {showEnOnFront ? 'English' : 'Tiếng Việt'}
            </span>
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {frontTitle}
              </h2>
              {showEnOnFront && (
                <button
                  onClick={handlePronounce}
                  className="p-1 text-slate-400 hover:text-emerald-700 transition"
                  title="Nghe phát âm"
                >
                  🔊
                </button>
              )}
            </div>

            {showEnOnFront && word.pronunciation && (
              <p className="text-sm font-mono text-slate-500">{word.pronunciation}</p>
            )}

            {word.part_of_speech && (
              <span className="inline-block text-xs italic bg-slate-100 px-2.5 py-0.5 rounded text-slate-600 mt-2">
                {word.part_of_speech}
              </span>
            )}
          </div>
        ) : (
          /* BACK OF CARD */
          <div className="space-y-4 py-4 text-left animate-fadeIn">
            <div className="text-center pb-2 border-b border-slate-100">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                {showEnOnFront ? 'Nghĩa tiếng Việt' : 'English Word'}
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center justify-center gap-2">
                <span>{backTitle}</span>
                <button
                  onClick={handlePronounce}
                  className="p-1 text-slate-400 hover:text-emerald-700 transition"
                  title="Nghe phát âm"
                >
                  🔊
                </button>
              </div>
              {word.pronunciation && (
                <p className="text-xs font-mono text-slate-500 mt-1">{word.pronunciation}</p>
              )}
            </div>

            {word.example && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                <span className="font-semibold text-slate-500 block mb-0.5">Ví dụ:</span>
                <p className="italic">"{word.example}"</p>
              </div>
            )}

            {word.collocations && word.collocations.length > 0 && (
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-500">Collocations: </span>
                {word.collocations.join(' • ')}
              </div>
            )}

            {word.notes && (
              <div className="text-xs text-slate-500 pt-1">
                <span className="font-semibold">Ghi chú: </span>{word.notes}
              </div>
            )}
          </div>
        )}

        {/* Bottom Card Footer Hint */}
        <div className="text-xs text-slate-400 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span>Bấm <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono">Space</kbd> để lật thẻ</span>
          <span>Bấm phím <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono">1</kbd>-<kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono">4</kbd> để đánh giá</span>
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="space-y-3">
        {/* Rating Buttons */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => handleRating('again')}
            className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-semibold transition text-center"
          >
            1. Quên
          </button>
          <button
            onClick={() => handleRating('hard')}
            className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold transition text-center"
          >
            2. Khó
          </button>
          <button
            onClick={() => handleRating('good')}
            className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition text-center shadow-sm"
          >
            3. Nhớ tốt
          </button>
          <button
            onClick={() => handleRating('easy')}
            className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold transition text-center"
          >
            4. Rất dễ
          </button>
        </div>

        {/* Navigation buttons: Prev / Flip / Next */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            onClick={handlePrevCard}
            disabled={currentIndex === 0}
            className="px-4 py-2 bg-white hover:bg-slate-50 disabled:opacity-40 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition"
          >
            ← Thẻ trước
          </button>

          <button
            onClick={() => setIsFlipped(prev => !prev)}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-800 transition"
          >
            {isFlipped ? 'Xem mặt trước' : 'Lật xem đáp án (Space)'}
          </button>

          <button
            onClick={handleNextCard}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition shadow-sm"
          >
            {isLastCard ? 'Hoàn thành' : 'Thẻ tiếp theo →'}
          </button>
        </div>
      </div>

    </div>
  );
};
