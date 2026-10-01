import React, { useState } from 'react';
import { importFromCSV, importFromRawText } from '../../storage/vocabStorage';

interface ImportModalProps {
  onClose: () => void;
  onImportCompleted: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  onClose,
  onImportCompleted,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const sampleCSV = `word,meaning,example
abandon,từ bỏ,They abandoned the project.
reluctant,miễn cưỡng,He was reluctant to go.
substantial,đáng kể,There was a substantial increase.`;

  const sampleText = `abandon - từ bỏ - They abandoned the project
reluctant : miễn cưỡng : He was reluctant to go
substantial - đáng kể - There was a substantial increase`;

  const handleProcessPastedText = () => {
    if (!pastedText.trim()) {
      setStatusMessage({ type: 'error', text: 'Vui lòng dán nội dung từ vựng cần nhập.' });
      return;
    }

    let result;
    if (pastedText.trim().startsWith('{') || pastedText.trim().startsWith('[')) {
      result = importFromRawText(pastedText);
    } else if (pastedText.includes(',') && pastedText.split('\n')[0].includes(',')) {
      result = importFromCSV(pastedText);
    } else {
      result = importFromRawText(pastedText);
    }

    if (result.added > 0) {
      setStatusMessage({
        type: 'success',
        text: `Đã thêm thành công ${result.added} từ vựng mới vào cơ sở dữ liệu!`,
      });
      setTimeout(() => {
        onImportCompleted();
        onClose();
      }, 1200);
    } else {
      setStatusMessage({
        type: 'error',
        text: result.errors[0] || 'Không thể nhập từ (các từ có thể đã tồn tại hoặc định dạng chưa đúng).',
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      let result;
      if (file.name.endsWith('.json')) {
        result = importFromRawText(content);
      } else {
        result = importFromCSV(content);
      }

      if (result.added > 0) {
        setStatusMessage({
          type: 'success',
          text: `Đã thêm thành công ${result.added} từ từ tệp ${file.name}!`,
        });
        setTimeout(() => {
          onImportCompleted();
          onClose();
        }, 1200);
      } else {
        setStatusMessage({
          type: 'error',
          text: result.errors[0] || 'Không tìm thấy từ mới hợp lệ trong tệp.',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Nhập từ vựng hàng loạt</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-4 flex gap-3 border-b border-slate-100">
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'paste' 
                ? 'border-emerald-600 text-emerald-700' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Dán văn bản trực tiếp
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`pb-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'file' 
                ? 'border-emerald-600 text-emerald-700' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Tải lên tệp CSV / JSON
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {statusMessage && (
            <div className={`p-3 rounded-xl border text-xs font-medium ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {statusMessage.text}
            </div>
          )}

          {activeTab === 'paste' ? (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 leading-relaxed">
                Hỗ trợ định dạng phân cách bằng dấu gạch ngang (<code>-</code>), hai chấm (<code>:</code>) hoặc CSV (<code>word,meaning,example</code>).
              </div>
              <textarea
                rows={7}
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder={sampleText}
                className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 outline-none resize-none"
              />
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={() => setPastedText(sampleCSV)}
                  className="hover:text-emerald-700 underline"
                >
                  Dùng mẫu CSV
                </button>
                <span>Hỗ trợ cả mảng JSON chuẩn</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50 group">
                <span className="text-sm font-semibold text-slate-700">
                  Chọn tệp .csv hoặc .json
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Kéo thả hoặc nhấp để duyệt file
                </span>
                <input
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
                <div className="font-semibold text-slate-700">Cấu trúc cột CSV:</div>
                <code>word,meaning,example,pronunciation,part_of_speech</code>
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="pt-2 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-lg transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleProcessPastedText}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                Xác nhận nhập từ
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
