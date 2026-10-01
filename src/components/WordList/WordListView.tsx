import React, { useState, useMemo } from 'react';
import { VocabularyItem } from '../../types';
import { exportVocabularyCSV, exportVocabularyJSON } from '../../storage/vocabStorage';
import { isDue } from '../../engine/srs';
import { playPronunciation } from '../../utils/speech';
import { getAllTopics } from '../../utils/topics';

interface WordListViewProps {
  vocabulary: VocabularyItem[];
  onSelectWord: (word: VocabularyItem) => void;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onDeleteWord: (id: string) => void;
  onDeleteMultipleWords: (ids: string[]) => void;
}

export const WordListView: React.FC<WordListViewProps> = ({
  vocabulary,
  onSelectWord,
  onOpenAddModal,
  onOpenImportModal,
  onDeleteWord,
  onDeleteMultipleWords,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [weakFilter, setWeakFilter] = useState<boolean>(false);
  const [dueFilter, setDueFilter] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'alpha' | 'accuracy' | 'nextReview' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const availableTopics = useMemo(() => getAllTopics(vocabulary), [vocabulary]);

  // Filtered & Sorted items
  const filteredWords = useMemo(() => {
    const now = new Date();
    return vocabulary
      .filter(item => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchWord = item.word.toLowerCase().includes(q);
          const matchMeaning = item.meaning.toLowerCase().includes(q);
          const matchExample = (item.example || '').toLowerCase().includes(q);
          if (!matchWord && !matchMeaning && !matchExample) return false;
        }

        if (statusFilter !== 'all' && item.status !== statusFilter) {
          return false;
        }

        if (topicFilter !== 'all') {
          const hasTopic = item.topics && item.topics.some(t => t.toLowerCase() === topicFilter.toLowerCase());
          if (!hasTopic) return false;
        }

        if (weakFilter) {
          const enAttempts = item.english_to_vietnamese.correctCount + item.english_to_vietnamese.incorrectCount;
          const viAttempts = item.vietnamese_to_english.correctCount + item.vietnamese_to_english.incorrectCount;
          const isWeak = (enAttempts > 0 && item.english_to_vietnamese.accuracy < 70) ||
                         (viAttempts > 0 && item.vietnamese_to_english.accuracy < 70);
          if (!isWeak) return false;
        }

        if (dueFilter) {
          const isItemDue = isDue(item.english_to_vietnamese, now) || isDue(item.vietnamese_to_english, now);
          if (!isItemDue) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'alpha') {
          diff = a.word.localeCompare(b.word);
        } else if (sortBy === 'accuracy') {
          const avgA = (a.english_to_vietnamese.accuracy + a.vietnamese_to_english.accuracy) / 2;
          const avgB = (b.english_to_vietnamese.accuracy + b.vietnamese_to_english.accuracy) / 2;
          diff = avgA - avgB;
        } else if (sortBy === 'nextReview') {
          const dateA = a.vietnamese_to_english.nextReview || a.english_to_vietnamese.nextReview || '9999';
          const dateB = b.vietnamese_to_english.nextReview || b.english_to_vietnamese.nextReview || '9999';
          diff = dateA.localeCompare(dateB);
        } else {
          diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [vocabulary, searchQuery, statusFilter, weakFilter, dueFilter, sortBy, sortOrder]);

  const isAllSelected = filteredWords.length > 0 && filteredWords.every(w => selectedIds.includes(w.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredWords.map(w => w.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDeleteBatch = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Bạn chắc chắn muốn xoá ${selectedIds.length} từ vựng đã chọn khỏi danh sách?`)) {
      onDeleteMultipleWords(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleDeleteSingleRow = (item: VocabularyItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Bạn chắc chắn muốn xoá từ "${item.word}"?`)) {
      onDeleteWord(item.id);
      setSelectedIds(prev => prev.filter(id => id !== item.id));
    }
  };

  const handleExportCSV = () => {
    const csv = exportVocabularyCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocab_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleExportJSON = () => {
    const json = exportVocabularyJSON();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocab_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const formatNextReviewBrief = (item: VocabularyItem) => {
    const nextDateStr = item.vietnamese_to_english.nextReview || item.english_to_vietnamese.nextReview;
    if (!nextDateStr) return '—';
    const now = new Date();
    const diff = Math.ceil((new Date(nextDateStr).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Hôm nay';
    if (diff === 1) return 'Ngày mai';
    return `${diff} ngày`;
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Danh sách từ vựng</span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
              {filteredWords.length} / {vocabulary.length} từ
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý từ vựng, theo dõi chỉ số nhớ hai chiều và khoảng cách ôn tập.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddModal}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            + Thêm từ mới
          </button>

          <button
            onClick={onOpenImportModal}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition"
          >
            Import
          </button>

          <button
            onClick={handleExportCSV}
            title="Xuất tệp CSV"
            className="px-2.5 py-2 bg-white hover:bg-slate-50 text-slate-600 rounded-lg border border-slate-200 text-xs font-medium transition"
          >
            CSV
          </button>

          <button
            onClick={handleExportJSON}
            title="Xuất tệp JSON"
            className="px-2.5 py-2 bg-white hover:bg-slate-50 text-slate-600 rounded-lg border border-slate-200 text-xs font-medium transition"
          >
            JSON
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo từ tiếng Anh, nghĩa tiếng Việt, câu ví dụ..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition"
            />
          </div>

          {/* Filters & Sorting */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="new">New (Mới)</option>
              <option value="learning">Learning (Đang học)</option>
              <option value="review">Review (Đang ôn)</option>
              <option value="mastered">Mastered (Thành thạo)</option>
            </select>

            <select
              value={topicFilter}
              onChange={e => setTopicFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Tất cả chủ đề</option>
              {availableTopics.map(t => (
                <option key={t.name} value={t.name}>{t.name} ({t.count})</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="date">Ngày thêm</option>
              <option value="alpha">Bảng chữ cái (A-Z)</option>
              <option value="accuracy">Độ chính xác</option>
              <option value="nextReview">Hạn ôn tập</option>
            </select>

            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 text-xs transition"
              title="Đảo chiều sắp xếp"
            >
              {sortOrder === 'asc' ? '↑ Tăng' : '↓ Giảm'}
            </button>
          </div>
        </div>

        {/* Quick Filter Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-500 font-medium">Lọc nhanh:</span>
          
          <button
            onClick={() => setDueFilter(!dueFilter)}
            className={`px-2.5 py-1 rounded-md border transition ${
              dueFilter 
                ? 'bg-amber-100 border-amber-300 text-amber-800 font-semibold' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Đến hạn ôn hôm nay
          </button>

          <button
            onClick={() => setWeakFilter(!weakFilter)}
            className={`px-2.5 py-1 rounded-md border transition ${
              weakFilter 
                ? 'bg-rose-100 border-rose-300 text-rose-800 font-semibold' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Từ yếu (Accuracy &lt; 70%)
          </button>

          {(statusFilter !== 'all' || weakFilter || dueFilter || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setWeakFilter(false);
                setDueFilter(false);
                setSearchQuery('');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline ml-2"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Multi-Selection Batch Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-20 z-20 flex items-center justify-between p-3.5 bg-rose-50 border border-rose-200 rounded-xl shadow-md text-sm animate-fadeIn">
          <div className="flex items-center gap-2 text-rose-900 font-medium">
            <span>Đã chọn: <strong>{selectedIds.length}</strong> từ vựng</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              Bỏ chọn
            </button>

            <button
              onClick={handleDeleteBatch}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              Xoá {selectedIds.length} từ đã chọn
            </button>
          </div>
        </div>
      )}

      {/* Clean White Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Từ vựng (English)</th>
                <th className="py-3 px-4">Nghĩa tiếng Việt</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-center">Anh → Việt</th>
                <th className="py-3 px-4 text-center">Việt → Anh</th>
                <th className="py-3 px-4 text-center">Hạn ôn</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Không tìm thấy từ vựng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredWords.map(item => {
                  const enAttempts = item.english_to_vietnamese.correctCount + item.english_to_vietnamese.incorrectCount;
                  const viAttempts = item.vietnamese_to_english.correctCount + item.vietnamese_to_english.incorrectCount;
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <tr 
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition cursor-pointer group ${
                        isSelected ? 'bg-emerald-50/30' : ''
                      }`}
                      onClick={() => onSelectWord(item)}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(item.id)}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* Word & Audio */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              playPronunciation(item.word);
                            }}
                            className="text-slate-400 hover:text-emerald-600 p-1 rounded hover:bg-slate-100 transition"
                            title="Nghe phát âm"
                          >
                            🔊
                          </button>
                          <div>
                            <span className="font-semibold text-slate-900 group-hover:text-emerald-700 transition">
                              {item.word}
                            </span>
                            {item.part_of_speech && (
                              <span className="ml-1.5 text-[11px] text-slate-400 italic">
                                ({item.part_of_speech})
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Meaning & Topics */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-slate-700 truncate">{item.meaning}</div>
                        {item.topics && item.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.topics.slice(0, 2).map(t => (
                              <span key={t} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.status === 'mastered' ? 'bg-emerald-100 text-emerald-800' :
                          item.status === 'review' ? 'bg-blue-100 text-blue-800' :
                          item.status === 'learning' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {item.status}
                        </span>
                      </td>

                      {/* EN -> VI Accuracy */}
                      <td className="py-3.5 px-4 text-center">
                        {enAttempts === 0 ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          <span className={`text-xs font-semibold ${
                            item.english_to_vietnamese.accuracy >= 80 ? 'text-emerald-600' :
                            item.english_to_vietnamese.accuracy >= 60 ? 'text-amber-600' :
                            'text-rose-600'
                          }`}>
                            {item.english_to_vietnamese.accuracy}%
                          </span>
                        )}
                      </td>

                      {/* VI -> EN Accuracy */}
                      <td className="py-3.5 px-4 text-center">
                        {viAttempts === 0 ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          <span className={`text-xs font-semibold ${
                            item.vietnamese_to_english.accuracy >= 80 ? 'text-emerald-600' :
                            item.vietnamese_to_english.accuracy >= 60 ? 'text-amber-600' :
                            'text-rose-600'
                          }`}>
                            {item.vietnamese_to_english.accuracy}%
                          </span>
                        )}
                      </td>

                      {/* Next Review */}
                      <td className="py-3.5 px-4 text-center text-xs text-slate-500">
                        {formatNextReviewBrief(item)}
                      </td>

                      {/* Actions: View & Delete */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => onSelectWord(item)}
                            className="px-2 py-1 text-slate-600 hover:text-slate-900 text-xs rounded hover:bg-slate-100 transition"
                            title="Chi tiết"
                          >
                            Chi tiết
                          </button>
                          <button
                            onClick={e => handleDeleteSingleRow(item, e)}
                            className="px-2 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded text-xs font-semibold transition"
                            title="Xoá từ này"
                          >
                            Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
