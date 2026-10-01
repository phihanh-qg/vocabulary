import React from 'react';
import { VocabularyItem } from '../../types';
import { getWordHistory } from '../../storage/historyStorage';
import { playPronunciation } from '../../utils/speech';

interface WordDetailModalProps {
  word: VocabularyItem;
  onClose: () => void;
  onResetSRS: (id: string) => void;
  onDeleteWord: (id: string) => void;
}

export const WordDetailModal: React.FC<WordDetailModalProps> = ({
  word,
  onClose,
  onResetSRS,
  onDeleteWord,
}) => {
  const historyLogs = getWordHistory(word.id);

  const formatReviewDate = (isoString: string | null) => {
    if (!isoString) return 'Chưa có lịch';
    const date = new Date(isoString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Hôm nay / Đã đến hạn';
    if (diffDays === 1) return 'Ngày mai';
    return `${diffDays} ngày nữa (${date.toLocaleDateString('vi-VN')})`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {word.word}
              </h2>
              <button
                onClick={() => playPronunciation(word.word)}
                className="text-slate-400 hover:text-emerald-700 p-1 rounded-full hover:bg-slate-100 transition"
                title="Nghe phát âm"
              >
                🔊
              </button>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                word.status === 'mastered' ? 'bg-emerald-100 text-emerald-800' :
                word.status === 'review' ? 'bg-blue-100 text-blue-800' :
                word.status === 'learning' ? 'bg-amber-100 text-amber-800' :
                'bg-slate-100 text-slate-600'
              }`}>
                {word.status}
              </span>
            </div>
            
            <div className="text-sm font-mono text-slate-500 mt-1 flex items-center gap-2">
              {word.pronunciation && <span>{word.pronunciation}</span>}
              {word.part_of_speech && <span className="italic bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-700">{word.part_of_speech}</span>}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Meaning & Examples */}
          <div className="space-y-3">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Nghĩa tiếng Việt
              </span>
              <div className="text-lg font-semibold text-slate-900">
                {word.meaning}
              </div>
            </div>

            {word.example && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Ví dụ câu:</span>
                <p className="italic text-slate-700">"{word.example}"</p>
              </div>
            )}

            {word.notes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <span className="font-semibold text-slate-500 block mb-0.5">Ghi chú:</span>
                {word.notes}
              </div>
            )}

            {word.collocations && word.collocations.length > 0 && (
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Collocations: </span>
                {word.collocations.join(' • ')}
              </div>
            )}
          </div>

          {/* Dual-Direction SRS Stats */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Chỉ số Spaced Repetition độc lập hai chiều
            </h4>

            {/* EN -> VI */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700">Anh → Việt (Nhận diện)</span>
                <span className="text-emerald-700 font-bold">
                  {word.english_to_vietnamese.accuracy}% ({word.english_to_vietnamese.correctCount}/{word.english_to_vietnamese.correctCount + word.english_to_vietnamese.incorrectCount})
                </span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${word.english_to_vietnamese.accuracy}%` }}
                  className="h-full bg-emerald-600 rounded-full"
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Khoảng cách: {word.english_to_vietnamese.interval} ngày (Ease: {word.english_to_vietnamese.easeFactor})</span>
                <span>Ôn kế tiếp: {formatReviewDate(word.english_to_vietnamese.nextReview)}</span>
              </div>
            </div>

            {/* VI -> EN */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700">Việt → Anh (Productive Recall)</span>
                <span className="text-blue-700 font-bold">
                  {word.vietnamese_to_english.accuracy}% ({word.vietnamese_to_english.correctCount}/{word.vietnamese_to_english.correctCount + word.vietnamese_to_english.incorrectCount})
                </span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${word.vietnamese_to_english.accuracy}%` }}
                  className="h-full bg-blue-600 rounded-full"
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Khoảng cách: {word.vietnamese_to_english.interval} ngày (Ease: {word.vietnamese_to_english.easeFactor})</span>
                <span>Ôn kế tiếp: {formatReviewDate(word.vietnamese_to_english.nextReview)}</span>
              </div>
            </div>
          </div>

          {/* Review History Logs */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Lịch sử ôn tập gần đây
            </h4>

            {historyLogs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-1">
                Chưa có lượt ôn tập nào cho từ này.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {historyLogs.map(log => (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className={log.result === 'correct' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                        {log.result === 'correct' ? '✓' : '✗'}
                      </span>
                      <span className="text-slate-700">
                        {log.direction === 'vi_to_en' ? 'Việt → Anh' : 'Anh → Việt'}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        "{log.user_answer}"
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        log.rating === 'easy' ? 'bg-blue-100 text-blue-800' :
                        log.rating === 'good' ? 'bg-emerald-100 text-emerald-800' :
                        log.rating === 'hard' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {log.rating}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(log.reviewed_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm(`Đặt lại tiến trình ghi nhớ (SRS) cho từ "${word.word}" về trạng thái Mới?`)) {
                onResetSRS(word.id);
                onClose();
              }
            }}
            className="text-xs text-amber-700 hover:text-amber-800 px-3 py-1.5 rounded-lg hover:bg-amber-100/50 transition font-medium"
          >
            Đặt lại tiến trình (Reset SRS)
          </button>

          <button
            onClick={() => {
              if (confirm(`Bạn chắc chắn muốn xóa từ "${word.word}"?`)) {
                onDeleteWord(word.id);
                onClose();
              }
            }}
            className="text-xs text-rose-600 hover:text-rose-800 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition font-bold"
          >
            Xóa từ này
          </button>
        </div>

      </div>
    </div>
  );
};
