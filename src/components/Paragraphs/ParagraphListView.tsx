import React, { useState } from 'react';
import { ParagraphItem } from '../../types';
import { deleteParagraph, loadParagraphs } from '../../storage/paragraphStorage';
import { AddParagraphModal } from './AddParagraphModal';

interface ParagraphListViewProps {
  onSelectParagraph: (paragraph: ParagraphItem) => void;
}

export const ParagraphListView: React.FC<ParagraphListViewProps> = ({
  onSelectParagraph
}) => {
  const [paragraphs, setParagraphs] = useState<ParagraphItem[]>(loadParagraphs());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParagraph, setEditingParagraph] = useState<ParagraphItem | null>(null);

  const refreshList = () => {
    setParagraphs(loadParagraphs());
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Bạn có chắc muốn xóa đoạn văn "${title}"?`)) {
      deleteParagraph(id);
      refreshList();
    }
  };

  const handleEdit = (p: ParagraphItem) => {
    setEditingParagraph(p);
    setIsModalOpen(true);
  };

  // Extract all unique topics
  const topics = Array.from(new Set(paragraphs.map(p => p.topic || 'General')));

  // Filter paragraphs
  const filtered = paragraphs.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.translation_vi && p.translation_vi.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTopic = selectedTopic === 'all' || p.topic === selectedTopic;

    return matchesSearch && matchesTopic;
  });

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      
      {/* Top Banner / Heading */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-semibold backdrop-blur">
            <span>📝</span>
            <span>Học thuộc đoạn văn & Active Recall Cloze Test</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Luyện trí nhớ & phản xạ Collocations
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Chọn một đoạn văn mẫu (IELTS Writing, học thuật hoặc tự tạo) để luyện tập điền từ còn thiếu. Phương pháp này giúp bạn ghi nhớ liên kết câu, ngữ pháp tự nhiên và từ vựng sâu sắc trong ngữ cảnh thực tế.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setEditingParagraph(null);
                setIsModalOpen(true);
              }}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition transform active:scale-95 inline-flex items-center gap-2"
            >
              <span>+</span>
              <span>Thêm đoạn văn mới của bạn</span>
            </button>
          </div>
        </div>

        {/* Decorative backdrop glow */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề, từ vựng hoặc nội dung..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
        </div>

        {/* Topic Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedTopic('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              selectedTopic === 'all'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({paragraphs.length})
          </button>
          {topics.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedTopic === t
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

      </div>

      {/* Paragraphs Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
          <div className="text-4xl mb-2">📄</div>
          <p className="font-semibold text-slate-700 text-sm">Không tìm thấy đoạn văn nào phù hợp</p>
          <p className="text-xs text-slate-400 mt-1">Hãy thử tìm từ khóa khác hoặc bấm nút thêm đoạn văn mới.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(p => {
            const wordCount = p.content.trim().split(/\s+/).filter(Boolean).length;
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                      {p.title}
                    </h3>
                    <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {p.topic}
                    </span>
                  </div>

                  {/* Content Preview */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-3">
                    {p.content}
                  </p>

                  {/* Vietnamese translation preview if present */}
                  {p.translation_vi && (
                    <p className="text-[11px] text-slate-400 italic line-clamp-1 mb-3">
                      🇻🇳 {p.translation_vi}
                    </p>
                  )}

                  {/* Metadata Chips */}
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-4 flex-wrap">
                    <span>📏 {wordCount} từ</span>
                    {p.best_score !== null && p.best_score !== undefined && (
                      <span className="text-emerald-600 font-semibold">
                        ⭐ Kỷ lục: {p.best_score}%
                      </span>
                    )}
                    {p.practice_count ? (
                      <span>🎯 Đã luyện {p.practice_count} lần</span>
                    ) : (
                      <span className="text-slate-400">Chưa luyện lần nào</span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEdit(p)}
                      title="Chỉnh sửa đoạn văn"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg text-xs transition"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.title)}
                      title="Xóa đoạn văn"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs transition"
                    >
                      🗑️ Xóa
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectParagraph(p)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
                  >
                    <span>Luyện điền từ</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <AddParagraphModal
          editingParagraph={editingParagraph}
          onClose={() => {
            setIsModalOpen(false);
            setEditingParagraph(null);
          }}
          onSaved={refreshList}
        />
      )}

    </div>
  );
};
