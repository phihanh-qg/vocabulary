import React, { useState } from 'react';
import { ParagraphItem } from '../../types';
import { addParagraph, updateParagraph } from '../../storage/paragraphStorage';

interface AddParagraphModalProps {
  onClose: () => void;
  onSaved: () => void;
  editingParagraph?: ParagraphItem | null;
}

export const AddParagraphModal: React.FC<AddParagraphModalProps> = ({
  onClose,
  onSaved,
  editingParagraph
}) => {
  const [title, setTitle] = useState(editingParagraph?.title || '');
  const [topic, setTopic] = useState(editingParagraph?.topic || 'General');
  const [content, setContent] = useState(editingParagraph?.content || '');
  const [translationVi, setTranslationVi] = useState(editingParagraph?.translation_vi || '');
  const [keywordsStr, setKeywordsStr] = useState((editingParagraph?.keywords || []).join(', '));
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(editingParagraph?.difficulty || 'medium');
  const [error, setError] = useState('');

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề cho đoạn văn');
      return;
    }
    if (!content.trim()) {
      setError('Vui lòng nhập nội dung đoạn văn tiếng Anh');
      return;
    }
    if (wordCount < 5) {
      setError('Đoạn văn cần có ít nhất 5 từ để luyện tập điền từ');
      return;
    }

    const keywords = keywordsStr
      .split(/[,;\n]/)
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (editingParagraph) {
      updateParagraph({
        ...editingParagraph,
        title: title.trim(),
        topic: topic.trim() || 'General',
        content: content.trim(),
        translation_vi: translationVi.trim() || undefined,
        keywords: keywords.length > 0 ? keywords : undefined,
        difficulty
      });
    } else {
      addParagraph({
        title: title.trim(),
        topic: topic.trim() || 'General',
        content: content.trim(),
        translation_vi: translationVi.trim() || undefined,
        keywords: keywords.length > 0 ? keywords : undefined,
        difficulty
      });
    }

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {editingParagraph ? 'Chỉnh sửa đoạn văn' : 'Thêm đoạn văn mới để học thuộc'}
            </h2>
            <p className="text-xs text-slate-500">
              Nhập đoạn văn tiếng Anh mẫu để luyện nhớ và điền từ khuyết.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              ⚠️ {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tiêu đề đoạn văn <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ví dụ: Vai trò của âm nhạc trong xã hội"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chủ đề (Topic)
              </label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Art, Society, Work..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Nội dung tiếng Anh <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {wordCount} từ
              </span>
            </div>
            <textarea
              rows={5}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Dán đoạn văn tiếng Anh vào đây. Ví dụ: There is ongoing debate over whether music functions as an indispensable pillar of society..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition leading-relaxed"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bản dịch tiếng Việt (Tùy chọn)
            </label>
            <textarea
              rows={3}
              value={translationVi}
              onChange={e => setTranslationVi(e.target.value)}
              placeholder="Nghĩa hoặc gợi ý tiếng Việt giúp bạn hiểu ngữ cảnh khi luyện..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Từ vựng trọng tâm cần ưu tiên ẩn (Keywords)
              </label>
              <input
                type="text"
                value={keywordsStr}
                onChange={e => setKeywordsStr(e.target.value)}
                placeholder="indispensable, pillar, cornerstone (ngăn cách bằng dấu phẩy)"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Khi chọn chế độ "Từ khóa trọng tâm", hệ thống sẽ ưu tiên đục lỗ các từ này.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Độ khó tham khảo
              </label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              >
                <option value="easy">Dễ (Easy)</option>
                <option value="medium">Trung bình (Medium)</option>
                <option value="hard">Nâng cao (Hard)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl shadow-sm transition"
            >
              {editingParagraph ? 'Cập nhật đoạn văn' : 'Lưu đoạn văn'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
