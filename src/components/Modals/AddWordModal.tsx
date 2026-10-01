import React, { useState } from 'react';
import { addVocabularyWord } from '../../storage/vocabStorage';

interface AddWordModalProps {
  onClose: () => void;
  onWordAdded: () => void;
}

export const AddWordModal: React.FC<AddWordModalProps> = ({
  onClose,
  onWordAdded,
}) => {
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('verb');
  const [example, setExample] = useState('');
  const [notes, setNotes] = useState('');
  const [topicsInput, setTopicsInput] = useState('General');

  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) {
      setError('Vui lòng nhập từ tiếng Anh');
      return;
    }
    if (!meaning.trim()) {
      setError('Vui lòng nhập nghĩa tiếng Việt');
      return;
    }

    const parsedTopics = topicsInput
      .split(/[,;]/)
      .map(t => t.trim())
      .filter(Boolean);

    addVocabularyWord({
      word,
      meaning,
      pronunciation,
      part_of_speech: partOfSpeech,
      example,
      notes,
      topics: parsedTopics.length > 0 ? parsedTopics : ['General'],
    });

    onWordAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Thêm từ vựng mới</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Word & POS */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Từ / Cụm từ tiếng Anh <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={word}
                onChange={e => { setWord(e.target.value); setError(''); }}
                placeholder="vd: abandon, pose a threat (to)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Từ loại
              </label>
              <select
                value={partOfSpeech}
                onChange={e => setPartOfSpeech(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-sm text-slate-700 rounded-xl outline-none focus:border-emerald-600 focus:bg-white"
              >
                <option value="verb">verb</option>
                <option value="noun">noun</option>
                <option value="adjective">adjective</option>
                <option value="adverb">adverb</option>
                <option value="verb phrase">verb phrase</option>
                <option value="idiom">idiom</option>
              </select>
            </div>
          </div>

          {/* Meaning */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Nghĩa tiếng Việt <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={meaning}
              onChange={e => { setMeaning(e.target.value); setError(''); }}
              placeholder="vd: từ bỏ, bỏ rơi (các nghĩa phân cách bằng dấu phẩy)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none"
            />
          </div>

          {/* Pronunciation */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Phiên âm IPA (tùy chọn)
            </label>
            <input
              type="text"
              value={pronunciation}
              onChange={e => setPronunciation(e.target.value)}
              placeholder="vd: /əˈbændən/"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-sm text-slate-900 placeholder-slate-400 font-mono outline-none"
            />
          </div>

          {/* Example */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Ví dụ minh họa (tùy chọn)
            </label>
            <textarea
              rows={2}
              value={example}
              onChange={e => setExample(e.target.value)}
              placeholder="vd: They abandoned the project after two years."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none resize-none"
            />
          </div>

          {/* Topics */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Chủ đề (Topics)
            </label>
            <input
              type="text"
              value={topicsInput}
              onChange={e => setTopicsInput(e.target.value)}
              placeholder="vd: Environment, Society, Education (phân cách bằng dấu phẩy)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none"
            />
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {['Environment', 'Technology', 'Society', 'Economy', 'Education', 'Health', 'Workplace'].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    const current = topicsInput ? topicsInput.split(/[,;]/).map(s => s.trim()) : [];
                    if (!current.includes(chip)) {
                      setTopicsInput(current.filter(c => c !== 'General').concat(chip).join(', '));
                    }
                  }}
                  className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition"
                >
                  +{chip}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Ghi chú / Collocations (tùy chọn)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="vd: Thường dùng với kế hoạch hoặc hy vọng."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-lg transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              Lưu vào kho từ
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
