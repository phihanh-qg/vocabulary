import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Layout/Navbar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { StudySessionView } from './components/Study/StudySessionView';
import { FlashcardSessionView } from './components/Study/FlashcardSessionView';
import { SessionCompleteView } from './components/Study/SessionCompleteView';
import { WordListView } from './components/WordList/WordListView';
import { WordDetailModal } from './components/WordList/WordDetailModal';
import { AddWordModal } from './components/Modals/AddWordModal';
import { ImportModal } from './components/Modals/ImportModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { TopicSelectModal } from './components/Modals/TopicSelectModal';
import { 
  AppSettings, 
  DashboardStats, 
  ParagraphItem,
  StudyCard, 
  StudyMode, 
  VocabularyItem 
} from './types';
import { ParagraphListView } from './components/Paragraphs/ParagraphListView';
import { ParagraphPracticeView } from './components/Paragraphs/ParagraphPracticeView';
import { 
  deleteVocabularyWord, 
  deleteMultipleVocabularyWords,
  getDashboardStats, 
  loadVocabulary, 
  resetWordSRS 
} from './storage/vocabStorage';
import { loadSettings } from './storage/settingsStorage';
import { buildStudyQueue } from './engine/queue';

export const App: React.FC = () => {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'study' | 'words' | 'paragraphs'>('dashboard');
  const [isStudying, setIsStudying] = useState<boolean>(false);
  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(false);
  const [selectedParagraph, setSelectedParagraph] = useState<ParagraphItem | null>(null);

  // Core Data States
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Active Session Cards
  const [sessionCards, setSessionCards] = useState<StudyCard[]>([]);
  const [currentMode, setCurrentMode] = useState<StudyMode>('quick');
  const [sessionStyle, setSessionStyle] = useState<'retrieval' | 'flashcard'>('retrieval');
  const [selectedTopicName, setSelectedTopicName] = useState<string | undefined>(undefined);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);

  // Refresh data from storage
  const refreshData = useCallback(() => {
    const loadedVocab = loadVocabulary();
    setVocabulary(loadedVocab);
    setStats(getDashboardStats());
  }, []);

  // Initial load
  useEffect(() => {
    refreshData();
    import('./storage/diskSync').then(m => {
      m.syncFromDisk().then(synced => {
        if (synced) refreshData();
      });
    });
  }, [refreshData]);

  // Start a new study session
  const handleStartSession = (
    mode: StudyMode,
    topic?: string,
    style: 'retrieval' | 'flashcard' = 'retrieval'
  ) => {
    setCurrentMode(mode);
    setSessionStyle(mode === 'flashcard' ? 'flashcard' : style);
    setSelectedTopicName(topic);

    const queue = buildStudyQueue(vocabulary, mode, settings, new Date(), topic);

    if (queue.length === 0) {
      alert('Không có từ nào phù hợp với chế độ học này vào thời điểm hiện tại!');
      return;
    }

    setSessionCards(queue);
    setIsStudying(true);
    setIsSessionComplete(false);
    setActiveTab('study');
  };

  const handleFinishSession = () => {
    setIsStudying(false);
    setIsSessionComplete(true);
    refreshData();
  };

  const handleExitSession = () => {
    if (confirm('Bạn có chắc muốn thoát phiên học hiện tại? Tiến trình những câu đã trả lời vẫn được lưu.')) {
      setIsStudying(false);
      setIsSessionComplete(false);
      setActiveTab('dashboard');
      refreshData();
    }
  };

  const handleReturnDashboard = () => {
    setIsSessionComplete(false);
    setActiveTab('dashboard');
    refreshData();
  };

  const handleContinueStudying = () => {
    setIsSessionComplete(false);
    handleStartSession(currentMode, selectedTopicName, sessionStyle);
  };

  const handleResetSRS = (id: string) => {
    resetWordSRS(id);
    refreshData();
  };

  const handleDeleteWord = (id: string) => {
    deleteVocabularyWord(id);
    refreshData();
  };

  const handleDeleteMultipleWords = (ids: string[]) => {
    deleteMultipleVocabularyWords(ids);
    refreshData();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-800">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={tab => {
          if (isStudying) {
            if (!confirm('Bạn đang trong phiên học. Bạn có chắc muốn rời đi?')) return;
            setIsStudying(false);
          }
          setIsSessionComplete(false);
          setActiveTab(tab);
          refreshData();
        }}
        streakDays={stats?.streakDays || 1}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        isStudying={isStudying}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6">
        
        {/* Active Study Session (Retrieval or Flashcard) */}
        {isStudying && sessionStyle === 'flashcard' ? (
          <FlashcardSessionView
            cards={sessionCards}
            onFinishSession={handleFinishSession}
            onExitSession={handleExitSession}
          />
        ) : isStudying ? (
          <StudySessionView
            cards={sessionCards}
            onFinishSession={handleFinishSession}
            onExitSession={handleExitSession}
          />
        ) : null}

        {/* Session Finished Summary */}
        {!isStudying && isSessionComplete && (
          <SessionCompleteView
            cards={sessionCards}
            onReturnDashboard={handleReturnDashboard}
            onContinueStudying={handleContinueStudying}
          />
        )}

        {/* Dashboard Tab */}
        {!isStudying && !isSessionComplete && activeTab === 'dashboard' && stats && (
          <DashboardView
            stats={stats}
            onStartSession={handleStartSession}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onOpenTopicModal={() => setIsTopicModalOpen(true)}
            onViewWordList={() => setActiveTab('words')}
          />
        )}

        {/* Study Entry Tab (when user clicks "Học bài" from nav) */}
        {!isStudying && !isSessionComplete && activeTab === 'study' && stats && (
          <div className="max-w-2xl mx-auto py-8 text-center space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">Chọn chế độ học</h2>
              <p className="text-slate-500 text-sm">
                Nhớ chủ động thông qua việc tự gõ đáp án và ôn tập đa chiều.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div 
                onClick={() => handleStartSession('quick')}
                className="p-5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 cursor-pointer transition shadow-sm group"
              >
                <div className="font-bold text-emerald-700 text-base mb-1">
                  Quick Review (Khuyên dùng)
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Kết hợp khoa học giữa Từ đến hạn + Từ yếu + Từ mới + Ôn tích lũy cũ.
                </p>
              </div>

              <div 
                onClick={() => setIsTopicModalOpen(true)}
                className="p-5 rounded-xl bg-white border border-slate-200 hover:border-sky-500 cursor-pointer transition shadow-sm group"
              >
                <div className="font-bold text-sky-700 text-base mb-1">
                  Ôn theo chủ đề
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Lọc và tập trung luyện tập theo chủ đề riêng (Academic, Daily, Work...).
                </p>
              </div>

              <div 
                onClick={() => handleStartSession('flashcard')}
                className="p-5 rounded-xl bg-white border border-slate-200 hover:border-indigo-500 cursor-pointer transition shadow-sm group"
              >
                <div className="font-bold text-indigo-700 text-base mb-1">
                  Flashcard (Lật thẻ)
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Chế độ lật thẻ phản xạ nhanh 2 mặt với phát âm âm thanh và chấm điểm SRS.
                </p>
              </div>

              <div 
                onClick={() => handleStartSession('due')}
                className="p-5 rounded-xl bg-white border border-slate-200 hover:border-amber-500 cursor-pointer transition shadow-sm group"
              >
                <div className="font-bold text-amber-700 text-base mb-1">
                  Due Reviews
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Chỉ học các từ đã đến hạn Spaced Repetition cần ôn hôm nay.
                </p>
              </div>

              <div 
                onClick={() => handleStartSession('weak')}
                className="p-5 rounded-xl bg-white border border-slate-200 hover:border-rose-500 cursor-pointer transition shadow-sm group"
              >
                <div className="font-bold text-rose-700 text-base mb-1">
                  Weak Words
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tập trung củng cố các từ có độ chính xác thấp (&lt; 70%).
                </p>
              </div>

              <div 
                onClick={() => handleStartSession('cumulative')}
                className="p-5 rounded-xl bg-white border border-slate-200 hover:border-purple-500 cursor-pointer transition shadow-sm group"
              >
                <div className="font-bold text-purple-700 text-base mb-1">
                  Cumulative Review
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Gọi lại các từ cũ đã học từ trước để chống quên lãng lâu dài.
                </p>
              </div>

              <div 
                onClick={() => {
                  setSelectedParagraph(null);
                  setActiveTab('paragraphs');
                }}
                className="p-5 rounded-xl bg-gradient-to-br from-indigo-50/70 to-indigo-100/50 border border-indigo-200 hover:border-indigo-500 cursor-pointer transition shadow-sm group sm:col-span-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-indigo-900 text-base flex items-center gap-2">
                    <span>📝</span>
                    <span>Học thuộc đoạn văn (Cloze Test)</span>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-600 text-white">
                    Mới
                  </span>
                </div>
                <p className="text-xs text-indigo-950/70 leading-relaxed">
                  Luyện trí nhớ đoạn văn IELTS / luận mẫu bằng cách điền từ còn thiếu trong ngữ cảnh câu văn hoàn chỉnh.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Word List Management Tab */}
        {!isStudying && !isSessionComplete && activeTab === 'words' && (
          <WordListView
            vocabulary={vocabulary}
            onSelectWord={word => setSelectedWord(word)}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onDeleteWord={handleDeleteWord}
            onDeleteMultipleWords={handleDeleteMultipleWords}
          />
        )}

        {/* Paragraphs Management & Practice Tab */}
        {!isStudying && !isSessionComplete && activeTab === 'paragraphs' && (
          selectedParagraph ? (
            <ParagraphPracticeView
              paragraph={selectedParagraph}
              onBack={() => setSelectedParagraph(null)}
            />
          ) : (
            <ParagraphListView
              onSelectParagraph={p => setSelectedParagraph(p)}
            />
          )
        )}

      </main>

      {/* Modals */}
      {selectedWord && (
        <WordDetailModal
          word={selectedWord}
          onClose={() => setSelectedWord(null)}
          onResetSRS={handleResetSRS}
          onDeleteWord={handleDeleteWord}
        />
      )}

      {isAddModalOpen && (
        <AddWordModal
          onClose={() => setIsAddModalOpen(false)}
          onWordAdded={refreshData}
        />
      )}

      {isImportModalOpen && (
        <ImportModal
          onClose={() => setIsImportModalOpen(false)}
          onImportCompleted={refreshData}
        />
      )}

      {isSettingsModalOpen && (
        <SettingsModal
          settings={settings}
          onClose={() => setIsSettingsModalOpen(false)}
          onSettingsSaved={newSettings => {
            setSettings(newSettings);
            refreshData();
          }}
        />
      )}

      {isTopicModalOpen && (
        <TopicSelectModal
          vocabulary={vocabulary}
          onClose={() => setIsTopicModalOpen(false)}
          onSelectTopic={(topic, style) => {
            setIsTopicModalOpen(false);
            handleStartSession(style === 'flashcard' ? 'flashcard' : 'topic', topic, style);
          }}
        />
      )}

    </div>
  );
};
