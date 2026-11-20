import React, { useEffect, useState } from 'react';
import { AppSettings } from '../../types';
import { DEFAULT_SETTINGS, saveSettings } from '../../storage/settingsStorage';
import {
  CloudSyncConfig,
  loadCloudSyncConfig,
  saveCloudSyncConfig,
  syncWithCloud,
} from '../../storage/cloudSync';
import {
  getLockScreenWidgetConfig,
  isAndroidNative,
  openQuickRecallScreen,
  requestOverlayPermission,
  setLockScreenWidgetConfig,
} from '../../utils/vocabWidgetBridge';

interface SettingsModalProps {
  settings: AppSettings;
  onClose: () => void;
  onSettingsSaved: (newSettings: AppSettings) => void;
  onDataSynced?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onClose,
  onSettingsSaved,
  onDataSynced,
}) => {
  const [form, setForm] = useState<AppSettings>({ ...settings });
  const [saved, setSaved] = useState(false);

  const [cloudConfig, setCloudConfig] = useState<CloudSyncConfig>(() => loadCloudSyncConfig());
  const [showToken, setShowToken] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const isAndroid = isAndroidNative();
  const [lockEnabled, setLockEnabled] = useState(false);
  const [autoPopupUnlock, setAutoPopupUnlock] = useState(false);
  const [canDrawOverlays, setCanDrawOverlays] = useState(true);

  useEffect(() => {
    if (isAndroid) {
      getLockScreenWidgetConfig().then(cfg => {
        setLockEnabled(cfg.enabled);
        setAutoPopupUnlock(cfg.autoPopup);
        setCanDrawOverlays(cfg.canDrawOverlays);
      });
    }
  }, [isAndroid]);

  const handleToggleLockScreen = async (nextEnabled: boolean, nextAutoPopup: boolean) => {
    setLockEnabled(nextEnabled);
    setAutoPopupUnlock(nextAutoPopup);
    await setLockScreenWidgetConfig(nextEnabled, nextAutoPopup);
  };

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
    saveCloudSyncConfig(cloudConfig);
    onSettingsSaved(form);
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleCloudSync = async (mode: 'merge' | 'push' | 'pull') => {
    saveCloudSyncConfig(cloudConfig);
    setIsSyncing(true);
    setSyncMessage(null);
    const res = await syncWithCloud(mode);
    setCloudConfig(loadCloudSyncConfig());
    setIsSyncing(false);
    setSyncMessage({ ok: res.success, text: res.message });
    if (res.success && res.updated && onDataSynced) {
      onDataSynced();
    }
  };

  const handleResetDefaults = () => {
    setForm({ ...DEFAULT_SETTINGS });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-slate-900">Cài đặt thuật toán &amp; Đồng bộ</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          
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

          {/* Android Lock Screen & Widget Section */}
          {isAndroid && (
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  📱 Widget &amp; Màn hình khóa
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Hiển thị từ vựng (ẩn nghĩa) ngoài màn hình khóa &amp; màn hình chính. Khi mở máy, chạm vào từ hoặc tự bật bảng nhập nghĩa để kiểm tra ngay.
              </p>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={lockEnabled}
                  onChange={e => handleToggleLockScreen(e.target.checked, autoPopupUnlock)}
                  className="rounded accent-emerald-600"
                />
                <span>Hiện từ vựng trên màn hình khóa (Thông báo liên tục)</span>
              </label>

              {lockEnabled && (
                <div className="pl-5 space-y-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoPopupUnlock}
                      onChange={e => handleToggleLockScreen(lockEnabled, e.target.checked)}
                      className="rounded accent-emerald-600"
                    />
                    <span>Tự động bật ô nhập kiểm tra mỗi khi mở khóa điện thoại</span>
                  </label>

                  {autoPopupUnlock && !canDrawOverlays && (
                    <button
                      type="button"
                      onClick={() => requestOverlayPermission()}
                      className="py-1.5 px-3 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 rounded-lg text-[11px] font-semibold transition"
                    >
                      ⚠️ Cấp quyền &quot;Hiển thị trên ứng dụng khác&quot; để tự bật khi mở khóa
                    </button>
                  )}
                </div>
              )}

              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => openQuickRecallScreen()}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                >
                  ⚡ Thử bảng kiểm tra nhanh
                </button>
              </div>
            </div>
          )}

          {/* Cloud Sync Section (GitHub Gist) */}
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/80 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                ☁️ Đồng bộ Cloud (PC ↔ Điện thoại)
              </span>
              {cloudConfig.lastSyncedAt && (
                <span className="text-[10px] text-indigo-600 font-medium">
                  Lần cuối: {new Date(cloudConfig.lastSyncedAt).toLocaleString('vi-VN')}
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Dùng <strong>GitHub Gist</strong> riêng tư miễn phí để tự động gộp tiến độ giữa PC và Android.
              Tạo Token có quyền <code className="px-1 py-0.5 bg-white rounded border border-indigo-100 text-[10px]">gist</code> tại GitHub → Settings → Developer settings.
            </p>

            <div className="space-y-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  GitHub Personal Access Token
                </label>
                <div className="flex gap-1.5">
                  <input
                    type={showToken ? 'text' : 'password'}
                    placeholder="ghp_xxxxxxxxxxxx hoặc github_pat_..."
                    value={cloudConfig.token}
                    onChange={e => setCloudConfig({ ...cloudConfig, token: e.target.value })}
                    className="flex-1 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-slate-900 outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(v => !v)}
                    className="px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                  >
                    {showToken ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Gist ID <span className="font-normal text-slate-400">(Để trống lần đầu để tự tạo Gist mới)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: a1b2c3d4e5f6..."
                  value={cloudConfig.gistId}
                  onChange={e => setCloudConfig({ ...cloudConfig, gistId: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-slate-900 font-mono outline-none focus:border-indigo-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none pt-0.5">
                <input
                  type="checkbox"
                  checked={cloudConfig.autoSync}
                  onChange={e => setCloudConfig({ ...cloudConfig, autoSync: e.target.checked })}
                  className="rounded accent-indigo-600"
                />
                <span>Tự động đồng bộ khi mở app và sau khi học</span>
              </label>
            </div>

            {syncMessage && (
              <div
                className={`p-2.5 rounded-lg text-[11px] font-medium border ${
                  syncMessage.ok
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {syncMessage.text}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={isSyncing || !cloudConfig.token.trim()}
                onClick={() => handleCloudSync('merge')}
                className="flex-1 min-w-[140px] py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition shadow-sm"
              >
                {isSyncing ? 'Đang đồng bộ...' : '🔄 Đồng bộ ngay (Gộp)'}
              </button>
              {cloudConfig.gistId.trim() && (
                <>
                  <button
                    type="button"
                    disabled={isSyncing || !cloudConfig.token.trim()}
                    onClick={() => handleCloudSync('pull')}
                    className="py-2 px-3 bg-white hover:bg-slate-50 disabled:opacity-50 border border-indigo-200 rounded-lg text-xs font-medium text-slate-700 transition"
                  >
                    ⬇ Tải về
                  </button>
                  <button
                    type="button"
                    disabled={isSyncing || !cloudConfig.token.trim()}
                    onClick={() => handleCloudSync('push')}
                    className="py-2 px-3 bg-white hover:bg-slate-50 disabled:opacity-50 border border-indigo-200 rounded-lg text-xs font-medium text-slate-700 transition"
                  >
                    ⬆ Đẩy lên
                  </button>
                </>
              )}
            </div>
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
