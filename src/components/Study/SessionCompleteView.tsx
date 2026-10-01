import React, { useEffect } from 'react';
import { StudyCard } from '../../types';
import { playCelebrationSound } from '../../utils/soundEffects';

interface SessionCompleteViewProps {
  cards: StudyCard[];
  onReturnDashboard: () => void;
  onContinueStudying: () => void;
}

export const SessionCompleteView: React.FC<SessionCompleteViewProps> = ({
  cards,
  onReturnDashboard,
  onContinueStudying,
}) => {
  useEffect(() => {
    playCelebrationSound();
  }, []);

  const totalCards = cards.length;
  const viToEnCount = cards.filter(c => c.direction === 'vi_to_en').length;
  const enToViCount = cards.filter(c => c.direction === 'en_to_vi').length;

  return (
    <div className="max-w-lg mx-auto py-12 px-4 space-y-6 text-center">
      <div className="text-4xl">
        🎉
      </div>

      <div className="space-y-1.5">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Hoàn thành phiên học xuất sắc!
        </h2>
        <p className="text-slate-500 text-sm">
          Bạn vừa củng cố khả năng truy xuất chủ động cho {totalCards} câu hỏi từ vựng.
        </p>
      </div>

      {/* Summary Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-left space-y-4 shadow-sm">
        <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
          Chi tiết phiên học
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
            <span className="text-xs text-blue-700 font-medium">Việt → Anh (Productive)</span>
            <div className="text-2xl font-bold text-blue-900 mt-0.5">{viToEnCount} câu</div>
          </div>

          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-xs text-emerald-700 font-medium">Anh → Việt (Nhận diện)</span>
            <div className="text-2xl font-bold text-emerald-900 mt-0.5">{enToViCount} câu</div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
          Hệ thống SRS đã tính toán lại khoảng cách ghi nhớ và tự động lên lịch cho các phiên tiếp theo.
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <button
          onClick={onReturnDashboard}
          className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm transition"
        >
          Về Dashboard
        </button>

        <button
          onClick={onContinueStudying}
          className="flex-1 py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-sm transition"
        >
          Học tiếp phiên mới
        </button>
      </div>
    </div>
  );
};
