import React, { useState, useEffect, useRef } from 'react';
import { BlankingMode, ParagraphItem } from '../../types';
import { generateClozeTokens, TokenItem } from '../../engine/clozeEngine';
import { recordParagraphPractice } from '../../storage/paragraphStorage';
import { playPronunciation } from '../../utils/speech';
import { playCorrectSound } from '../../utils/soundEffects';

interface ParagraphPracticeViewProps {
  paragraph: ParagraphItem;
  onBack: () => void;
}

export const ParagraphPracticeView: React.FC<ParagraphPracticeViewProps> = ({
  paragraph,
  onBack
}) => {
  const [mode, setMode] = useState<BlankingMode>('keywords');
  const [seed, setSeed] = useState<number>(0);
  const [showFirstLetterHint, setShowFirstLetterHint] = useState<boolean>(false);
  const [showTranslation, setShowTranslation] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Cloze tokens and user inputs
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [userInputs, setUserInputs] = useState<Record<number, string>>({});

  // Result state
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [scoreResult, setScoreResult] = useState<{
    totalBlanks: number;
    correctCount: number;
    percentage: number;
  } | null>(null);

  // References to input elements for auto-focus navigation
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Generate tokens when paragraph, mode, or seed changes
  useEffect(() => {
    const newTokens = generateClozeTokens(
      paragraph.content,
      mode,
      paragraph.keywords,
      seed
    );
    setTokens(newTokens);
    setUserInputs({});
    setIsSubmitted(false);
    setScoreResult(null);

    // Auto-focus first blank input
    setTimeout(() => {
      const firstBlank = newTokens.find(t => t.isBlank);
      if (firstBlank && inputRefs.current[firstBlank.id]) {
        inputRefs.current[firstBlank.id]?.focus();
      }
    }, 100);
  }, [paragraph, mode, seed]);

  const blankTokens = tokens.filter(t => t.isBlank);
  const filledCount = blankTokens.filter(t => (userInputs[t.id] || '').trim().length > 0).length;

  const handleInputChange = (id: number, val: string) => {
    if (isSubmitted) return;
    setUserInputs(prev => ({ ...prev, [id]: val }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentTokenId: number) => {
    if (e.key === 'Enter') {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      // Find next blank token
      const currentIdx = blankTokens.findIndex(t => t.id === currentTokenId);
      if (currentIdx !== -1 && currentIdx < blankTokens.length - 1) {
        const nextBlank = blankTokens[currentIdx + 1];
        inputRefs.current[nextBlank.id]?.focus();
      } else {
        // Last blank -> submit if almost done
        handleSubmit();
      }
    }
  };

  const handleRevealWord = (tokenId: number) => {
    const token = tokens.find(t => t.id === tokenId);
    if (!token) return;
    setUserInputs(prev => ({ ...prev, [tokenId]: token.cleanWord }));
  };

  const handleSpeech = () => {
    if (isSpeaking) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      playPronunciation(paragraph.content);
      setTimeout(() => setIsSpeaking(false), Math.min(15000, paragraph.content.length * 90));
    }
  };

  const handleSubmit = () => {
    if (blankTokens.length === 0) return;

    let correct = 0;
    blankTokens.forEach(t => {
      const input = (userInputs[t.id] || '').trim().toLowerCase();
      const expected = t.cleanWord.trim().toLowerCase();
      // Allow exact match or without apostrophes
      if (input === expected || input.replace(/['’]/g, '') === expected.replace(/['’]/g, '')) {
        correct++;
      }
    });

    const percentage = Math.round((correct / blankTokens.length) * 100);
    setScoreResult({
      totalBlanks: blankTokens.length,
      correctCount: correct,
      percentage
    });
    setIsSubmitted(true);

    if (percentage >= 80) {
      playCorrectSound();
    }

    recordParagraphPractice(paragraph.id, percentage);
  };

  const handleRetrySame = () => {
    setUserInputs({});
    setIsSubmitted(false);
    setScoreResult(null);
    setTimeout(() => {
      const first = blankTokens[0];
      if (first) inputRefs.current[first.id]?.focus();
    }, 100);
  };

  const handleShuffleNewBlanks = () => {
    setSeed(prev => prev + 1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-fadeIn">
      
      {/* Top Header & Navigation */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition mb-2"
          >
            ← Quay lại danh sách đoạn văn
          </button>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900">{paragraph.title}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              🏷️ {paragraph.topic}
            </span>
            {paragraph.best_score !== null && paragraph.best_score !== undefined && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Kỷ lục: {paragraph.best_score}%
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSpeech}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
              isSpeaking
                ? 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Nghe phát âm chuẩn toàn đoạn"
          >
            <span>{isSpeaking ? '⏹️' : '🔊'}</span>
            <span>{isSpeaking ? 'Dừng đọc' : 'Nghe toàn đoạn'}</span>
          </button>

          {paragraph.translation_vi && (
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
                showTranslation
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{showTranslation ? '📖 Ẩn dịch nghĩa' : '📖 Xem dịch nghĩa'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Vietnamese Translation Banner */}
      {showTranslation && paragraph.translation_vi && (
        <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 sm:p-5 text-indigo-950 text-sm leading-relaxed animate-fadeIn">
          <div className="font-semibold text-xs text-indigo-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span>🇻🇳</span> Bản dịch nghĩa tiếng Việt tham khảo
          </div>
          <p className="italic text-indigo-900">{paragraph.translation_vi}</p>
        </div>
      )}

      {/* Mode & Options Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        
        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="font-semibold text-slate-500 mr-1 whitespace-nowrap">Chế độ:</span>
          {(
            [
              { key: 'keywords', label: '🌟 Từ vựng trọng tâm' },
              { key: 'easy', label: '🟢 Dễ (20%)' },
              { key: 'medium', label: '🟡 Vừa (35%)' },
              { key: 'hard', label: '🔴 Khó (50%)' },
              { key: 'all', label: '🔥 Toàn bài (100%)' }
            ] as const
          ).map(item => (
            <button
              key={item.key}
              onClick={() => setMode(item.key)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                mode === item.key
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Hints and Tools */}
        <div className="flex items-center gap-2 justify-between sm:justify-end flex-wrap pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-slate-900 select-none">
            <input
              type="checkbox"
              checked={showFirstLetterHint}
              onChange={e => setShowFirstLetterHint(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
            />
            <span className="font-medium">Gợi ý chữ cái đầu</span>
          </label>

          <button
            onClick={handleShuffleNewBlanks}
            title="Đổi bộ từ bị ẩn ngẫu nhiên"
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-medium transition flex items-center gap-1"
          >
            <span>🎲</span>
            <span>Đổi từ ẩn</span>
          </button>
        </div>

      </div>

      {/* Main Cloze Interactive Reading Box */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
        
        {/* Progress Bar inside box */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-6 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span>Tiến độ điền từ:</span>
            <span className="font-bold text-indigo-600">
              {filledCount} / {blankTokens.length} từ
            </span>
          </div>
          <div className="text-[11px] text-slate-400 hidden sm:block">
            Mẹo: Nhấn <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">Enter</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">Tab</kbd> để nhảy nhanh sang ô tiếp theo
          </div>
        </div>

        {/* Paragraph Cloze Stream */}
        <div className="text-slate-800 text-base sm:text-lg leading-[2.6] sm:leading-[2.8] select-text font-normal">
          {tokens.map((token) => {
            if (!token.isWord) {
              // Whitespace or punctuation tokens
              return <span key={token.id}>{token.raw}</span>;
            }

            if (!token.isBlank) {
              // Word is visible
              return (
                <span key={token.id} className="font-medium text-slate-800">
                  {token.raw}
                </span>
              );
            }

            // Word is a blank to fill
            const userInput = userInputs[token.id] || '';
            const isCorrect = userInput.trim().toLowerCase() === token.cleanWord.trim().toLowerCase();

            // Compute input width dynamically based on expected word length
            const charWidth = Math.max(token.cleanWord.length, 3);
            const inputWidthStyle = { width: `${Math.max(charWidth * 12 + 18, 54)}px` };

            return (
              <span key={token.id} className="inline-flex items-baseline align-baseline mx-1">
                {token.prefix}
                
                {!isSubmitted ? (
                  <span className="relative inline-block align-baseline group">
                    <input
                      ref={el => (inputRefs.current[token.id] = el)}
                      type="text"
                      value={userInput}
                      onChange={e => handleInputChange(token.id, e.target.value)}
                      onKeyDown={e => handleKeyDown(e, token.id)}
                      placeholder={
                        showFirstLetterHint
                          ? `${token.hintLetter}... (${token.cleanWord.length})`
                          : `... (${token.cleanWord.length})`
                      }
                      style={inputWidthStyle}
                      className={`px-2 py-0.5 text-center text-sm sm:text-base font-semibold border-b-2 outline-none rounded-t-md transition-all ${
                        userInput.trim()
                          ? 'bg-indigo-50/60 border-indigo-500 text-indigo-900'
                          : 'bg-slate-50 border-slate-300 text-slate-800 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-200'
                      }`}
                      autoCapitalize="none"
                      autoComplete="off"
                      spellCheck={false}
                    />

                    {/* Quick reveal button on hover if user is stuck */}
                    {!userInput.trim() && (
                      <button
                        onClick={() => handleRevealWord(token.id)}
                        title="Xem đáp án từ này"
                        type="button"
                        className="opacity-0 group-hover:opacity-100 transition absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] px-1.5 py-0.2 bg-slate-800 text-white rounded shadow pointer-events-auto"
                      >
                        Gợi ý
                      </button>
                    )}
                  </span>
                ) : (
                  // Submitted mode feedback
                  <span className="inline-flex items-baseline gap-1">
                    {isCorrect ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-sm sm:text-base inline-flex items-center gap-1 shadow-sm">
                        <span>✓</span>
                        <span>{token.cleanWord}</span>
                      </span>
                    ) : (
                      <span className="inline-flex flex-col items-center bg-rose-50 border border-rose-200 rounded-md px-2 py-0.5 align-middle shadow-sm">
                        {userInput.trim() ? (
                          <span className="line-through text-rose-500 text-xs font-medium">
                            {userInput}
                          </span>
                        ) : (
                          <span className="text-rose-400 text-xs italic">
                            (chưa điền)
                          </span>
                        )}
                        <span className="text-emerald-700 font-bold text-xs sm:text-sm">
                          {token.cleanWord}
                        </span>
                      </span>
                    )}
                  </span>
                )}

                {token.suffix}
              </span>
            );
          })}
        </div>

        {/* Practice Result Score Card */}
        {isSubmitted && scoreResult && (
          <div className="mt-8 pt-6 border-t border-slate-200 animate-slideUp">
            <div className={`p-6 rounded-2xl border text-center ${
              scoreResult.percentage >= 80
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : scoreResult.percentage >= 50
                ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                : 'bg-rose-50/80 border-rose-200 text-rose-950'
            }`}>
              <div className="text-3xl mb-2">
                {scoreResult.percentage >= 90
                  ? '🏆 Xuất sắc!'
                  : scoreResult.percentage >= 75
                  ? '🎉 Làm rất tốt!'
                  : scoreResult.percentage >= 50
                  ? '👍 Khá tốt!'
                  : '💪 Cố gắng thêm nhé!'}
              </div>
              <div className="text-xl font-bold mb-1">
                Điền chính xác: {scoreResult.correctCount} / {scoreResult.totalBlanks} từ ({scoreResult.percentage}%)
              </div>
              <p className="text-xs text-slate-600 max-w-md mx-auto mb-5">
                {scoreResult.percentage >= 80
                  ? 'Bạn đã ghi nhớ cấu trúc và từ vựng nòng cốt của đoạn văn này rất vững vàng!'
                  : 'Hãy quan sát các từ chưa đúng màu đỏ để ghi nhớ chính tả và collocations rồi thử lại nhé.'}
              </p>

              {/* Action Buttons in result */}
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={handleRetrySame}
                  className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 font-semibold rounded-xl border border-slate-200 shadow-sm text-xs transition"
                >
                  🔄 Làm lại bộ từ này
                </button>
                <button
                  onClick={handleShuffleNewBlanks}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-sm text-xs transition"
                >
                  🎲 Đổi vị trí từ ẩn khác
                </button>
                <button
                  onClick={onBack}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                >
                  Quay lại danh sách
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Control Bar */}
        {!isSubmitted && (
          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <button
              onClick={() => {
                // Reveal all
                const allFilled: Record<number, string> = {};
                blankTokens.forEach(t => {
                  allFilled[t.id] = t.cleanWord;
                });
                setUserInputs(allFilled);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              👁️ Xem tất cả đáp án
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRetrySame}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Xóa làm lại
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-md shadow-indigo-200 transition"
              >
                ✓ Kiểm tra kết quả
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
