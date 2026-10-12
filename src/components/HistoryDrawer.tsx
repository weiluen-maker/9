import React, { useState } from 'react';
import { HistoryRecord, deleteRecord, clearAllRecords, toggleFavorite } from '../utils/db';
import {
  Clock,
  X,
  Trash2,
  Download,
  ArrowUpRight,
  Search,
  Star,
  FileJson,
  UploadCloud,
  Check,
  Copy,
  Sparkles,
  Database,
  ShieldCheck,
} from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  records: HistoryRecord[];
  onReloadRecords: () => void;
  onSelectRecord: (record: HistoryRecord) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  records,
  onReloadRecords,
  onSelectRecord,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = records.filter((r) => {
    if (filterFavorite && !r.favorite) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.prompt.toLowerCase().includes(term) ||
      (r.presetTitle && r.presetTitle.toLowerCase().includes(term)) ||
      r.aspectRatio.toLowerCase().includes(term)
    );
  });

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('確定要刪除這筆處理記錄嗎？')) {
      await deleteRecord(id);
      onReloadRecords();
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('確定要清空所有處理記錄嗎？此操作無法撤銷。')) {
      await clearAllRecords();
      onReloadRecords();
    }
  };

  const handleToggleFav = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await toggleFavorite(id);
    onReloadRecords();
  };

  const handleCopyPrompt = (e: React.MouseEvent, prompt: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadImage = (e: React.MouseEvent, dataUrl: string, id: string) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `nebula-history-${id.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nebula-records-backup-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Main Drawer Panel */}
      <div className="relative w-full max-w-md h-full bg-[#0b0f1e]/95 border-l border-cyan-500/20 shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm tracking-wide text-white flex items-center gap-2">
                數據庫記錄庫
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {records.length} 筆
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>自動即時存檔 · 永不遺失</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 border-b border-slate-800/80 space-y-2 bg-slate-900/20">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋提示詞、標籤或比例..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <button
              onClick={() => setFilterFavorite(!filterFavorite)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
                filterFavorite
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Star className={`w-3 h-3 ${filterFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>僅看已收藏</span>
            </button>

            {records.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportJson}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
                  title="匯出 JSON 備份檔"
                >
                  <FileJson className="w-3 h-3" />
                  <span>備份</span>
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1 text-[11px] text-rose-400/80 hover:text-rose-300 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>清空</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Record Cards List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {filtered.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Clock className="w-10 h-10 mb-2 opacity-30 text-cyan-400" />
              <p className="text-xs text-slate-400">目前尚無符合的處理記錄</p>
              <p className="text-[11px] text-slate-600 mt-1">每次生成的圖片成果都會自動保存至此數據庫</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectRecord(item);
                  onClose();
                }}
                className="group relative p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/10"
              >
                {/* Images Preview Row */}
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-700/60 bg-slate-950 flex-shrink-0">
                    <img
                      src={item.originalImage}
                      alt="Original"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] text-slate-400 text-center py-0.5">
                      原圖
                    </span>
                  </div>

                  <div className="text-slate-600 text-xs">➔</div>

                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-cyan-500/50 bg-slate-950 flex-shrink-0 shadow-md shadow-cyan-500/20">
                    <img
                      src={item.editedImage}
                      alt="Edited"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-cyan-950/85 text-[9px] text-cyan-300 text-center py-0.5">
                      AI 成果
                    </span>
                  </div>

                  {/* Metadata & Actions */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-16 py-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTime(item.createdAt)}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleToggleFav(e, item.id)}
                          className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                            item.favorite ? 'text-amber-400' : 'text-slate-500 hover:text-amber-300'
                          }`}
                          title="收藏"
                        >
                          <Star className={`w-3.5 h-3.5 ${item.favorite ? 'fill-amber-400' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, item.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="刪除記錄"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300 font-mono">
                        {item.aspectRatio}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
                        {item.durationMs ? `${(item.durationMs / 1000).toFixed(1)}s` : '完成'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prompt preview */}
                <div className="relative p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 line-clamp-2">
                  {item.prompt}
                </div>

                {/* Hover footer action bar */}
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <button
                    onClick={(e) => handleCopyPrompt(e, item.prompt, item.id)}
                    className="flex items-center gap-1 hover:text-cyan-300 transition-colors"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">已複製提示詞</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>複製指令</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDownloadImage(e, item.editedImage, item.id)}
                      className="flex items-center gap-1 hover:text-cyan-300 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>下載</span>
                    </button>
                    <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-medium">
                      <span>載入</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>雲端數據庫同步已就緒</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
