import React, { useState } from 'react';
import { VocabularyItem } from '../../types';
import { getAllTopics } from '../../utils/topics';

interface TopicSelectModalProps {
  vocabulary: VocabularyItem[];
  onClose: () => void;
  onSelectTopic: (topic: string, style: 'retrieval' | 'flashcard') => void;
}

export const TopicSelectModal: React.FC<TopicSelectModalProps> = ({
  vocabulary,
  onClose,
  onSelectTopic,
}) => {
  const topics = getAllTopics(vocabulary);
  const [studyStyle, setStudyStyle] = useState<'retrieval' | 'flashcard'>('retrieval');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Ôn tập theo chủ đề</h2>
            <p className="text-xs text-slate-500 mt-0.5">Chọn một chủ đề để tập trung củng cố từ vựng chuyên sâu</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Study Style Choice */}
        <div className="px-6 pt-4 pb-2">
          <label className="text-xs font-semibold text-slate-600 block mb-2">
            Phương pháp học:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setStudyStyle('retrieval')}
              className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition ${
                studyStyle === 'retrieval'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              ✍️ Nhớ chủ động (Gõ đáp án)
            </button>

            <button
              type="button"
              onClick={() => setStudyStyle('flashcard')}
              className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition ${
                studyStyle === 'flashcard'
                  ? 'bg-blue-50 border-blue-300 text-blue-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              🃏 Flashcard (Lật thẻ nhanh)
            </button>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="p-6 overflow-y-auto space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {topics.map(t => (
              <div
                key={t.name}
                onClick={() => {
                  onSelectTopic(t.name, studyStyle);
                  onClose();
                }}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 cursor-pointer transition flex items-center justify-between group"
              >
                <div>
                  <div className="font-semibold text-sm text-slate-900 group-hover:text-emerald-800 transition">
                    {t.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {t.count} từ vựng
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400 group-hover:text-emerald-700">
                  Học →
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
