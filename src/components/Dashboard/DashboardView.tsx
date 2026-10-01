import React from 'react';
import { DashboardStats, StudyMode } from '../../types';
import { getPast7DaysActivity } from '../../storage/historyStorage';

interface DashboardViewProps {
  stats: DashboardStats;
  onStartSession: (mode: StudyMode) => void;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onOpenTopicModal: () => void;
  onViewWordList: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  onStartSession,
  onOpenAddModal,
  onOpenImportModal,
  onOpenTopicModal,
  onViewWordList,
}) => {
  const weeklyData = getPast7DaysActivity();
  const maxReviewsInWeek = Math.max(10, ...weeklyData.map(d => d.count));

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      
      {/* Top Banner */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              Khoa học ghi nhớ: Retrieval Practice &amp; SRS
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Sẵn sàng cho phiên học hôm nay?
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              Nhớ chủ động bằng cách tự gõ câu trả lời, ôn giãn cách độc lập hai chiều Anh ⇄ Việt và củng cố liên tục từ cũ để khắc sâu vào trí nhớ dài hạn.
            </p>
          </div>

          {/* Quick Start Button */}
          <div>
            <button
              onClick={() => onStartSession('quick')}
              className="w-full sm:w-auto px-7 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-all hover:scale-[1.01] text-sm"
            >
              Bắt đầu phiên học ngay →
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: Today Overview Cards */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-base font-bold text-slate-900">
            Phiên học hôm nay
          </h2>
          <span className="text-xs text-slate-500">
            Đã hoàn thành: <strong className="text-emerald-700 font-semibold">{stats.todayReviewedCount}</strong> câu
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Total Queue Card */}
          <div 
            onClick={() => onStartSession('quick')}
            className="cursor-pointer p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1.5">
              <span>Cần học &amp; ôn</span>
              <span className="text-emerald-600 font-bold">→</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.todayTotalDue}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Phiên tổng hợp 4 nhóm
            </div>
          </div>

          {/* Due Reviews Card */}
          <div 
            onClick={() => onStartSession('due')}
            className="cursor-pointer p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-500 hover:shadow-sm transition"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1.5">
              <span>Đến hạn ôn</span>
              <span className="text-amber-600 font-bold">→</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700">
              {stats.todayDueReviews}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Spaced Repetition
            </div>
          </div>

          {/* New Words Card */}
          <div 
            onClick={() => onStartSession('new')}
            className="cursor-pointer p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-sm transition"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1.5">
              <span>Từ mới</span>
              <span className="text-blue-600 font-bold">→</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-700">
              {stats.todayNewWords}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Chưa bắt đầu học
            </div>
          </div>

          {/* Cumulative Review Card */}
          <div 
            onClick={() => onStartSession('cumulative')}
            className="cursor-pointer p-4 rounded-xl bg-white border border-slate-200 hover:border-purple-500 hover:shadow-sm transition"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1.5">
              <span>Cumulative Review</span>
              <span className="text-purple-600 font-bold">→</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-700">
              {stats.todayCumulativeCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Từ cũ quay lại củng cố
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Progress & Accuracy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Memory Distribution Bar */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tiến độ ghi nhớ từ vựng
              </h3>
              <p className="text-xs text-slate-500">Tổng số {stats.totalWords} từ trong kho dữ liệu</p>
            </div>
            <button
              onClick={onViewWordList}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Xem danh sách từ →
            </button>
          </div>

          {/* Segmented Progress Bar */}
          <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
            <div 
              style={{ width: `${(stats.statusCounts.new / (stats.totalWords || 1)) * 100}%` }}
              className="bg-slate-300 transition-all"
              title={`New: ${stats.statusCounts.new}`}
            />
            <div 
              style={{ width: `${(stats.statusCounts.learning / (stats.totalWords || 1)) * 100}%` }}
              className="bg-amber-400 transition-all"
              title={`Learning: ${stats.statusCounts.learning}`}
            />
            <div 
              style={{ width: `${(stats.statusCounts.review / (stats.totalWords || 1)) * 100}%` }}
              className="bg-blue-400 transition-all"
              title={`Review: ${stats.statusCounts.review}`}
            />
            <div 
              style={{ width: `${(stats.statusCounts.mastered / (stats.totalWords || 1)) * 100}%` }}
              className="bg-emerald-500 transition-all"
              title={`Mastered: ${stats.statusCounts.mastered}`}
            />
          </div>

          {/* Breakdown Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-xs text-slate-500 font-medium mb-0.5">New</div>
              <div className="text-lg font-bold text-slate-900">{stats.statusCounts.new}</div>
              <div className="text-[10px] text-slate-400">Chưa bắt đầu</div>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-100">
              <div className="text-xs text-amber-700 font-medium mb-0.5">Learning</div>
              <div className="text-lg font-bold text-amber-900">{stats.statusCounts.learning}</div>
              <div className="text-[10px] text-amber-600">&lt; 3 ngày</div>
            </div>

            <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
              <div className="text-xs text-blue-700 font-medium mb-0.5">Review</div>
              <div className="text-lg font-bold text-blue-900">{stats.statusCounts.review}</div>
              <div className="text-[10px] text-blue-600">3 - 21 ngày</div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
              <div className="text-xs text-emerald-700 font-medium mb-0.5">Mastered</div>
              <div className="text-lg font-bold text-emerald-900">{stats.statusCounts.mastered}</div>
              <div className="text-[10px] text-emerald-600">&gt; 21 ngày &amp; &gt; 80%</div>
            </div>
          </div>
        </div>

        {/* Accuracy & Productive Recall Stats */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Độ chính xác hai chiều
          </h3>

          <div className="space-y-3 pt-1">
            {/* EN -> VI */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600">Anh → Việt (Nhận diện)</span>
                <span className="text-emerald-700 font-bold">{stats.enToViAccuracy}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${stats.enToViAccuracy}%` }} 
                  className="h-full bg-emerald-600 rounded-full transition-all"
                />
              </div>
            </div>

            {/* VI -> EN */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600">Việt → Anh (Productive Recall)</span>
                <span className="text-blue-700 font-bold">{stats.viToEnAccuracy}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${stats.viToEnAccuracy}%` }} 
                  className="h-full bg-blue-600 rounded-full transition-all"
                />
              </div>
            </div>

            {/* Overall Accuracy */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600">Độ chính xác chung</span>
                <span className="text-slate-900 font-bold">{stats.overallAccuracy}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${stats.overallAccuracy}%` }} 
                  className="h-full bg-slate-800 rounded-full transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
            <span>Tổng lượt truy xuất:</span>
            <span className="font-semibold text-slate-900">{stats.totalReviewsDone} lượt</span>
          </div>
        </div>
      </div>

      {/* Section 3: 7-Day Activity Chart */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Hoạt động 7 ngày gần đây
            </h3>
            <p className="text-xs text-slate-500">Số câu đã tự nhớ và hoàn thành</p>
          </div>
          <div className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-semibold">
            Streak: {stats.streakDays} ngày liên tiếp
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="h-40 flex items-end justify-between gap-3 pt-4 px-2">
          {weeklyData.map((item, idx) => {
            const heightPercent = Math.max(8, Math.round((item.count / maxReviewsInWeek) * 100));
            const isToday = idx === weeklyData.length - 1;

            return (
              <div key={item.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.count} câu
                </div>
                <div 
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[40px] rounded-t-md transition-all duration-300 ${
                    isToday 
                      ? 'bg-emerald-600' 
                      : item.count > 0 
                        ? 'bg-slate-300 hover:bg-slate-400' 
                        : 'bg-slate-100'
                  }`}
                />
                <span className={`text-xs font-medium ${isToday ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Study Modes Quick Launcher */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3">Chế độ học tập</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          
          <div 
            onClick={() => onStartSession('quick')}
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 transition cursor-pointer flex flex-col justify-between shadow-sm group"
          >
            <div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition">
                ⚡ Quick Review
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tự động trộn New + Due + Weak + Cumulative theo tỷ lệ khoa học.
              </p>
            </div>
            <div className="mt-4 text-xs font-semibold text-emerald-700">
              Bắt đầu ngay →
            </div>
          </div>

          <div 
            onClick={onOpenTopicModal}
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-teal-500 transition cursor-pointer flex flex-col justify-between shadow-sm group"
          >
            <div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition">
                🏷️ Ôn theo chủ đề
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Chọn chuyên đề (Environment, Tech, Economy...) để củng cố từ vựng tập trung.
              </p>
            </div>
            <div className="mt-4 text-xs font-semibold text-teal-700">
              Chọn chủ đề →
            </div>
          </div>

          <div 
            onClick={() => onStartSession('flashcard')}
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-500 transition cursor-pointer flex flex-col justify-between shadow-sm group"
          >
            <div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition">
                🃏 Flashcard lật thẻ
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Chế độ lật thẻ 2 mặt kèm audio phát âm và tự đánh giá nhanh.
              </p>
            </div>
            <div className="mt-4 text-xs font-semibold text-blue-700">
              Lật thẻ nhanh →
            </div>
          </div>

          <div 
            onClick={() => onStartSession('due')}
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-amber-500 transition cursor-pointer flex flex-col justify-between shadow-sm group"
          >
            <div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-amber-700 transition">
                🔄 Due Reviews
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tập trung giải quyết các từ đã đến hạn Spaced Repetition hôm nay.
              </p>
            </div>
            <div className="mt-4 text-xs font-semibold text-amber-700">
              Ôn đến hạn →
            </div>
          </div>

          <div 
            onClick={() => onStartSession('weak')}
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-rose-500 transition cursor-pointer flex flex-col justify-between shadow-sm group"
          >
            <div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-rose-700 transition">
                ⚠️ Weak Words
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Lọc riêng các từ hay trả lời sai hoặc accuracy thấp dưới 70%.
              </p>
            </div>
            <div className="mt-4 text-xs font-semibold text-rose-700">
              Củng cố điểm yếu →
            </div>
          </div>

          <div 
            onClick={() => onStartSession('cumulative')}
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-purple-500 transition cursor-pointer flex flex-col justify-between shadow-sm group"
          >
            <div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition">
                🔁 Cumulative Review
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Đưa các từ cũ đã học từ tuần/tháng trước quay lại tránh quên lãng.
              </p>
            </div>
            <div className="mt-4 text-xs font-semibold text-purple-700">
              Ôn tích lũy →
            </div>
          </div>

        </div>
      </div>

      {/* Quick Word Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-500 shadow-sm">
        <div>
          Cơ sở từ vựng: Thêm từ mới hoặc nhập hàng loạt từ tệp.
        </div>
        <div className="flex gap-2">
          <button
            onClick={onOpenAddModal}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
          >
            + Thêm từ thủ công
          </button>
          <button
            onClick={onOpenImportModal}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
          >
            Nhập CSV / JSON
          </button>
        </div>
      </div>

    </div>
  );
};
