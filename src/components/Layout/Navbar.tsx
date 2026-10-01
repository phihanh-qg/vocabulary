import React, { useState } from 'react';
import { isSoundEnabled, setSoundEnabled, playCorrectSound } from '../../utils/soundEffects';

interface NavbarProps {
  activeTab: 'dashboard' | 'study' | 'words' | 'paragraphs';
  setActiveTab: (tab: 'dashboard' | 'study' | 'words' | 'paragraphs') => void;
  streakDays: number;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onOpenSettingsModal: () => void;
  isStudying?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  streakDays,
  onOpenAddModal,
  onOpenImportModal,
  onOpenSettingsModal,
  isStudying = false,
}) => {
  const [soundOn, setSoundOn] = useState<boolean>(isSoundEnabled());

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      playCorrectSound();
    }
  };
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-baseline gap-2 cursor-pointer select-none"
        >
          <span className="font-bold text-xl tracking-tight text-slate-900">
            Active<span className="text-emerald-600">Recall</span>
          </span>
          <span className="text-xs text-slate-400 font-normal hidden sm:inline">
            Học từ vựng chủ động
          </span>
        </div>

        {/* Center Tabs */}
        {!isStudying && (
          <nav className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80">
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
              <span className="text-[10px] px-1.5 py-0.2 bg-indigo-50 text-indigo-600 rounded font-semibold border border-indigo-100 hidden md:inline">
                Mới
              </span>
            </button>
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Streak indicator */}
          <div className="px-2.5 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-amber-700 text-xs font-semibold">
            🔥 {streakDays} ngày
          </div>

          {/* Sound toggle button */}
          <button
            onClick={handleToggleSound}
            title={soundOn ? 'Âm thanh: Bật (Nhấp để tắt)' : 'Âm thanh: Tắt (Nhấp để bật)'}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition flex items-center gap-1 ${
              soundOn 
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-700' 
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
          >
            <span>{soundOn ? '🔊' : '🔇'}</span>
            <span className="hidden sm:inline text-[11px]">{soundOn ? 'Âm thanh' : 'Tắt tiếng'}</span>
          </button>

          {!isStudying && (
            <>
              <button
                onClick={onOpenAddModal}
                className="hidden sm:inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                + Thêm từ
              </button>

              <button
                onClick={onOpenImportModal}
                className="hidden sm:inline-flex items-center px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition"
              >
                Import
              </button>

              <button
                onClick={onOpenSettingsModal}
                title="Cài đặt"
                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 transition text-xs font-medium"
              >
                Cài đặt
              </button>
            </>
          )}
        </div>

      </div>
    </header>
  );
};
