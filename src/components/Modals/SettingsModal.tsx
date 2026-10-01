import React, { useState } from 'react';
import { AppSettings } from '../../types';
import { DEFAULT_SETTINGS, saveSettings } from '../../storage/settingsStorage';

interface SettingsModalProps {
  settings: AppSettings;
  onClose: () => void;
  onSettingsSaved: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onClose,
  onSettingsSaved,
}) => {
  const [form, setForm] = useState<AppSettings>({ ...settings });
  const [saved, setSaved] = useState(false);

  const handleRatioChange = (enRatio: number) => {
    const clampedEn = Math.max(0, Math.min(100, enRatio));
    setForm(prev => ({
      ...prev,
      enToViRatio: clampedEn,
      viToEnRatio: 100 - clampedEn,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(form);
    onSettingsSaved(form);
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleResetDefaults = () => {
    setForm({ ...DEFAULT_SETTINGS });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Cài đặt thuật toán &amp; Phiên học</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Daily Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Từ mới mỗi ngày
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={form.newWordsPerDay}
                onChange={e => setForm({ ...form, newWordsPerDay: parseInt(e.target.value) || 10 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
              />
              <span className="text-[10px] text-slate-400">Mặc định: 10 từ/ngày</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Kích thước phiên học
              </label>
              <input
                type="number"
                min={5}
                max={60}
                value={form.sessionSize}
                onChange={e => setForm({ ...form, sessionSize: parseInt(e.target.value) || 20 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
              />
              <span className="text-[10px] text-slate-400">Mặc định: 20 câu/phiên</span>
            </div>
          </div>

          {/* Cumulative Review count */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Số từ cũ ôn tích lũy mỗi phiên (Cumulative Review)
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.cumulativeCount}
              onChange={e => setForm({ ...form, cumulativeCount: parseInt(e.target.value) || 5 })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
            />
            <span className="text-[10px] text-slate-400">
              Các từ đã Mastered/Review sẽ định kỳ xuất hiện lại chống quên lãng dài hạn.
            </span>
          </div>

          {/* Direction ratio slider */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-emerald-700">Anh → Việt: {form.enToViRatio}%</span>
              <span className="text-blue-700">Việt → Anh (Productive): {form.viToEnRatio}%</span>
            </div>

            <input
              type="range"
              min={10}
              max={90}
              step={5}
              value={form.enToViRatio}
              onChange={e => handleRatioChange(parseInt(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Khuyến nghị đặt 60% cho Việt → Anh để kích hoạt tối đa khả năng <em>productive recall</em> (tự truy xuất từ vựng từ nghĩa).
            </p>
          </div>

          {/* Backup & Persistence Section */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Lưu trữ &amp; Sao lưu
              </span>
              <span className="text-[10px] text-emerald-700 font-medium">
                Tự động lưu vào data/study_data.json
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Dữ liệu được lưu an toàn trên máy tính. Bạn có thể tải bản sao lưu để dự phòng:
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  import('../../storage/diskSync').then(m => {
                    const backup = m.generateFullBackup();
                    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `activerecall_backup_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                  });
                }}
                className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition text-center shadow-sm"
              >
                Tải bản sao lưu (.json)
              </button>

              <label className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition text-center cursor-pointer shadow-sm">
                <span>Khôi phục dữ liệu</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = event => {
                      try {
                        const parsed = JSON.parse(event.target?.result as string);
                        import('../../storage/diskSync').then(m => {
                          const res = m.restoreFullBackup(parsed);
                          alert(res.message);
                          if (res.success) {
                            window.location.reload();
                          }
                        });
                      } catch {
                        alert('Tệp JSON không hợp lệ!');
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-slate-500 hover:text-slate-800 transition"
            >
              Khôi phục mặc định
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              {saved ? 'Đã lưu!' : 'Lưu cài đặt'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
