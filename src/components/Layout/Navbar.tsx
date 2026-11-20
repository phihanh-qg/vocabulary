import React, { useEffect, useState } from 'react';
import { LayoutDashboard, BookOpen, List, FileText, Cloud, RefreshCw, Plus, Settings } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, playCorrectSound } from '../../utils/soundEffects';
import {
  isCloudSyncConfigured,
  subscribeCloudSync,
  syncWithCloud,
  SyncState,
} from '../../storage/cloudSync';

interface NavbarProps {
  activeTab: 'dashboard' | 'study' | 'words' | 'paragraphs';
  setActiveTab: (tab: 'dashboard' | 'study' | 'words' | 'paragraphs') => void;
  streakDays: number;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onOpenSettingsModal: () => void;
  onDataSynced?: () => void;
  isStudying?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  streakDays,
  onOpenAddModal,
  onOpenImportModal,
  onOpenSettingsModal,
  onDataSynced,
  isStudying = false,
}) => {
  const [soundOn, setSoundOn] = useState<boolean>(isSoundEnabled());
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    message: '',
    lastSyncedAt: null,
  });

  useEffect(() => {
    return subscribeCloudSync(setSyncState);
  }, []);

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      playCorrectSound();
    }
  };

  const handleQuickSync = async () => {
    if (!isCloudSyncConfigured()) {
      onOpenSettingsModal();
      return;
    }
    const res = await syncWithCloud('merge');
    if (res.success && res.updated && onDataSynced) {
      onDataSynced();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          
          {/* Brand */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-baseline gap-2 cursor-pointer select-none shrink-0"
          >
            <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-900">
              Active<span className="text-emerald-600">Recall</span>
            </span>
            <span className="text-xs text-slate-400 font-normal hidden lg:inline">
              Học từ vựng chủ động
            </span>
          </div>

          {/* Center Tabs (Desktop) */}
          {!isStudying && (
            <nav className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dashboard
              </button>

              <button
                onClick={() => setActiveTab('study')}
                className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'study'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Học bài
              </button>

              <button
                onClick={() => setActiveTab('words')}
                className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'words'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Từ vựng
              </button>

              <button
                onClick={() => setActiveTab('paragraphs')}
                className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'paragraphs'
                    ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                <span>Đoạn văn</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-indigo-50 text-indigo-600 rounded font-semibold border border-indigo-100 hidden lg:inline">
                  Mới
                </span>
              </button>
            </nav>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Streak indicator */}
            <div className="px-2 sm:px-2.5 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-amber-700 text-xs font-semibold whitespace-nowrap">
              🔥 {streakDays} <span className="hidden sm:inline">ngày</span>
            </div>

            {/* Cloud Sync Quick Button */}
            {!isStudying && (
              <button
                onClick={handleQuickSync}
                title={
                  !isCloudSyncConfigured()
                    ? 'Thiết lập đồng bộ Cloud'
                    : syncState.message || 'Đồng bộ Cloud ngay'
                }
                className={`px-2 sm:px-2.5 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1 ${
                  syncState.status === 'syncing'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                    : syncState.status === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : isCloudSyncConfigured()
                    ? 'bg-indigo-50/70 border-indigo-200 text-indigo-700 hover:bg-indigo-100/70'
                    : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                {syncState.status === 'syncing' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Cloud className="w-3.5 h-3.5" />
                )}
                <span className="hidden lg:inline">
                  {syncState.status === 'syncing' ? 'Đang đồng bộ' : 'Sync'}
                </span>
              </button>
            )}

            {/* Sound toggle button */}
            <button
              onClick={handleToggleSound}
              title={soundOn ? 'Âm thanh: Bật (Nhấp để tắt)' : 'Âm thanh: Tắt (Nhấp để bật)'}
              className={`px-2 sm:px-2.5 py-1 rounded-lg border text-xs font-medium transition flex items-center gap-1 ${
                soundOn 
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-700' 
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
            >
              <span>{soundOn ? '🔊' : '🔇'}</span>
              <span className="hidden lg:inline text-[11px]">{soundOn ? 'Âm thanh' : 'Tắt tiếng'}</span>
            </button>

            {!isStudying && (
              <>
                <button
                  onClick={onOpenAddModal}
                  title="Thêm từ mới"
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5 sm:hidden" />
                  <span className="hidden sm:inline">+ Thêm từ</span>
                </button>

                <button
                  onClick={onOpenImportModal}
                  className="hidden sm:inline-flex items-center px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition"
                >
                  Import
                </button>

                <button
                  onClick={onOpenSettingsModal}
                  title="Cài đặt & Đồng bộ"
                  className="p-1.5 sm:px-2.5 sm:py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 transition text-xs font-medium flex items-center gap-1"
                >
                  <Settings className="w-4 h-4 sm:hidden" />
                  <span className="hidden sm:inline">Cài đặt</span>
                </button>
              </>
            )}
          </div>

        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      {!isStudying && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-4 h-16">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
                activeTab === 'dashboard'
                  ? 'text-emerald-600 font-semibold'
                  : 'text-slate-500'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('study')}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
                activeTab === 'study'
                  ? 'text-emerald-600 font-semibold'
                  : 'text-slate-500'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span>Học bài</span>
            </button>

            <button
              onClick={() => setActiveTab('words')}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
                activeTab === 'words'
                  ? 'text-emerald-600 font-semibold'
                  : 'text-slate-500'
              }`}
            >
              <List className="w-5 h-5" />
              <span>Từ vựng</span>
            </button>

            <button
              onClick={() => setActiveTab('paragraphs')}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
                activeTab === 'paragraphs'
                  ? 'text-indigo-600 font-semibold'
                  : 'text-slate-500'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Đoạn văn</span>
            </button>
          </div>
        </nav>
      )}
    </>
  );
};
