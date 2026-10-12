import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Sparkles,
  Sliders,
  Image as ImageIcon,
  Download,
  RotateCcw,
  RefreshCw,
  Copy,
  Check,
  Maximize2,
  AlertCircle,
  HelpCircle,
  Zap,
  Layers,
  ArrowRight,
  Database,
  Eye,
  Camera,
  Film,
  Cpu,
  ChevronDown,
} from 'lucide-react';
import { Header } from './components/Header';
import { ParticleBackground } from './components/ParticleBackground';
import { ImageComparisonSlider } from './components/ImageComparisonSlider';
import { HistoryDrawer } from './components/HistoryDrawer';
import {
  PRESET_PROMPTS,
  ASPECT_RATIOS,
  QUICK_TAGS,
  SAMPLE_IMAGES,
  PresetPrompt,
  AspectRatioOption,
} from './constants/presets';
import { saveRecord, getAllRecords, HistoryRecord } from './utils/db';
import { simulateImageEdit } from './utils/simulateEdit';

export default function App() {
  // Image states
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceMime, setSourceMime] = useState<string>('image/png');
  const [sourceMeta, setSourceMeta] = useState<{ width: number; height: number; size: string } | null>(null);

  // Result states
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultMeta, setResultMeta] = useState<{
    modelUsed: string;
    durationMs: number;
    description?: string;
  } | null>(null);

  // Configuration
  const [selectedRatio, setSelectedRatio] = useState<string>('original');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [presetCategory, setPresetCategory] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash-image');

  // UI States
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [particlesActive, setParticlesActive] = useState<boolean>(true);
  const [saveFormat, setSaveFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [isFullscreenModal, setIsFullscreenModal] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [elapsedTimer, setElapsedTimer] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Load history records from IndexedDB on startup
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const records = await getAllRecords();
      setHistoryRecords(records);
    } catch (e) {
      console.error('Failed to load records from IndexedDB:', e);
    }
  };

  // Clipboard paste listener to paste images anywhere
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Timer counter during generation
  useEffect(() => {
    if (isGenerating) {
      setElapsedTimer(0);
      timerIntervalRef.current = setInterval(() => {
        setElapsedTimer((prev) => prev + 0.1);
      }, 100);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isGenerating]);

  // Handle uploaded file
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('請上傳有效的圖片格式（支援 PNG, JPG, WEBP）。');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('圖片檔案大小請小於 25MB。');
      return;
    }

    setErrorMessage(null);
    const mime = file.type || 'image/png';
    setSourceMime(mime);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setSourceImage(dataUrl);
      setResultImage(null);
      setResultMeta(null);

      // Extract image dimensions
      const img = new Image();
      img.onload = () => {
        setSourceMeta({
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectSample = (sample: (typeof SAMPLE_IMAGES)[0]) => {
    setSourceImage(sample.dataUrl);
    setSourceMime('image/png');
    setResultImage(null);
    setResultMeta(null);
    setSourceMeta({ width: 600, height: 600, size: '測試樣圖' });
    // Also suggest preset
    const matched = PRESET_PROMPTS.find((p) => p.title.includes(sample.promptSuggest));
    if (matched) {
      handleApplyPreset(matched);
    }
  };

  const handleApplyPreset = (preset: PresetPrompt) => {
    setActivePresetId(preset.id);
    setCustomPrompt(preset.prompt);
    if (preset.suggestedRatio && preset.suggestedRatio !== 'original') {
      setSelectedRatio(preset.suggestedRatio);
    }
  };

  const handleAppendTag = (tag: string) => {
    setCustomPrompt((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return tag;
      if (trimmed.includes(tag)) return trimmed;
      return `${trimmed}，${tag}`;
    });
  };

  // Trigger Gemini API image generation
  const handleGenerate = async () => {
    if (!sourceImage) {
      setErrorMessage('請先上傳待修改的圖片。');
      return;
    }

    if (!customPrompt.trim()) {
      setErrorMessage('請輸入修改提示詞或點選快捷預設。');
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: sourceImage,
          mimeType: sourceMime,
          prompt: customPrompt,
          aspectRatio: selectedRatio,
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '圖片修改生成失敗，請稍後重試。');
      }

      setResultImage(data.image);
      setResultMeta({
        modelUsed: data.modelUsed,
        durationMs: data.durationMs,
        description: data.description,
      });

      // Automatically save record to IndexedDB Cloud Database
      const newRecord: HistoryRecord = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: Date.now(),
        originalImage: sourceImage,
        editedImage: data.image,
        prompt: customPrompt,
        presetTitle: PRESET_PROMPTS.find((p) => p.id === activePresetId)?.title,
        aspectRatio: selectedRatio,
        modelUsed: data.modelUsed,
        durationMs: data.durationMs,
        favorite: false,
      };

      await saveRecord(newRecord);
      await loadHistory();
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMessage(err.message || '連線逾時或模型處理錯誤，請檢視網路與提示詞後重試。');
    } finally {
      setIsGenerating(false);
    }
  };

  // Immediate simulation generation (ideal for quota-free testing & preview)
  const handleSimulateGenerate = async () => {
    if (!sourceImage) {
      setErrorMessage('請先上傳待修改的圖片。');
      return;
    }
    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const simulatedResult = await simulateImageEdit(
        sourceImage,
        activePresetId,
        customPrompt || 'AI 智慧風格渲染重塑',
        selectedRatio
      );

      setResultImage(simulatedResult);
      setResultMeta({
        modelUsed: `${selectedModel} (模擬渲染)`,
        durationMs: 780,
        description: '成功套用色彩矩陣與光影映射',
      });

      const newRecord: HistoryRecord = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: Date.now(),
        originalImage: sourceImage,
        editedImage: simulatedResult,
        prompt: customPrompt || 'AI 智慧風格渲染重塑',
        presetTitle: PRESET_PROMPTS.find((p) => p.id === activePresetId)?.title || '自訂修圖',
        aspectRatio: selectedRatio,
        modelUsed: `${selectedModel} (模擬渲染)`,
        durationMs: 780,
        favorite: false,
      };

      await saveRecord(newRecord);
      await loadHistory();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('模擬渲染時發生問題。');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save / Download image to local device
  const handleDownload = () => {
    if (!resultImage) return;

    // Convert to desired format if requested
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const mime = `image/${saveFormat}`;
      const exportUrl = canvas.toDataURL(mime, 0.95);

      const link = document.createElement('a');
      link.href = exportUrl;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.download = `nebula-gemini-${timestamp}.${saveFormat === 'jpeg' ? 'jpg' : saveFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = resultImage;
  };

  // Copy result image to clipboard
  const handleCopyImage = async () => {
    if (!resultImage) return;
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(async (blob) => {
          if (!blob) return;
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            setCopiedSuccess(true);
            setTimeout(() => setCopiedSuccess(false), 2200);
          } catch (err) {
            console.warn('Clipboard write failed:', err);
          }
        }, 'image/png');
      };
      img.src = resultImage;
    } catch (e) {
      console.error(e);
    }
  };

  // Use edited image as next source image (Iterative editing)
  const handleUseAsNextInput = () => {
    if (!resultImage) return;
    setSourceImage(resultImage);
    setSourceMime('image/png');
    setResultImage(null);
    setResultMeta(null);
  };

  // Load record from history
  const handleSelectHistoryRecord = (record: HistoryRecord) => {
    setSourceImage(record.originalImage);
    setResultImage(record.editedImage);
    setCustomPrompt(record.prompt);
    setSelectedRatio(record.aspectRatio);
    setResultMeta({
      modelUsed: record.modelUsed,
      durationMs: record.durationMs,
    });
  };

  // Filter presets by category
  const filteredPresets = PRESET_PROMPTS.filter((p) => {
    if (presetCategory === 'all') return true;
    return p.category === presetCategory;
  });

  return (
    <div className="relative min-h-screen flex flex-col font-['Plus_Jakarta_Sans',sans-serif] text-slate-100 bg-[#070913] selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Particle & Cosmic Gradient Background */}
      <ParticleBackground active={particlesActive} />

      {/* Top Navbar */}
      <Header
        onOpenHistory={() => setHistoryOpen(true)}
        historyCount={historyRecords.length}
        particlesActive={particlesActive}
        onToggleParticles={() => setParticlesActive(!particlesActive)}
      />

      {/* Main Studio Grid */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT COLUMN: CREATIVE CONTROL CONSOLE ================= */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* 1. Upload Card */}
            <div className="rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-cyan-500/25 p-5 shadow-xl shadow-cyan-950/20 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
                    01
                  </div>
                  <h2 className="text-sm font-semibold tracking-wide text-white">上傳來源圖片</h2>
                </div>
                {sourceImage && (
                  <button
                    onClick={() => {
                      setSourceImage(null);
                      setResultImage(null);
                      setResultMeta(null);
                      setSourceMeta(null);
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>更換圖片</span>
                  </button>
                )}
              </div>

              {/* Upload Dropzone */}
              {!sourceImage ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                    isDragOver
                      ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20 scale-[0.99]'
                      : 'border-slate-700/80 hover:border-cyan-500/50 bg-slate-950/40 hover:bg-slate-900/60'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-inner group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-200">
                    點擊或拖曳圖片至此處
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    支援 PNG, JPG, WEBP · 支援鍵盤 <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300 font-mono">Ctrl+V</kbd> 貼上
                  </p>

                  {/* Sample presets for instant test */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 w-full" onClick={(e) => e.stopPropagation()}>
                    <p className="text-[11px] text-slate-400 mb-2">或者點選測試樣圖：</p>
                    <div className="grid grid-cols-2 gap-2">
                      {SAMPLE_IMAGES.map((sample) => (
                        <button
                          key={sample.id}
                          type="button"
                          onClick={() => handleSelectSample(sample)}
                          className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/30 text-left transition-all text-xs"
                        >
                          <img src={sample.dataUrl} alt={sample.title} className="w-7 h-7 rounded object-cover" />
                          <span className="truncate text-[11px] text-slate-300">{sample.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Uploaded Preview Mini Card */
                <div className="relative rounded-xl overflow-hidden border border-cyan-500/30 bg-slate-950/60 p-2 flex items-center gap-3">
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-700 bg-black flex-shrink-0">
                    <img src={sourceImage} alt="Uploaded Source" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>已就緒待修改</span>
                    </div>
                    {sourceMeta && (
                      <p className="text-slate-400 text-[11px] font-mono mt-1">
                        解析度：{sourceMeta.width} × {sourceMeta.height}
                      </p>
                    )}
                    <p className="text-slate-500 text-[11px] mt-0.5 font-mono">
                      格式：{sourceMime.replace('image/', '').toUpperCase()} · {sourceMeta?.size}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Aspect Ratio Settings Card */}
            <div className="rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-cyan-500/25 p-5 shadow-xl shadow-cyan-950/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
                    02
                  </div>
                  <h2 className="text-sm font-semibold tracking-wide text-white">設定畫面輸出比例</h2>
                </div>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                  {selectedRatio}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {ASPECT_RATIOS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedRatio(item.ratio)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      selectedRatio === item.ratio
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div
                      className={`mb-1.5 rounded-sm border ${
                        selectedRatio === item.ratio
                          ? 'border-cyan-300 bg-cyan-400/30'
                          : 'border-slate-600 bg-slate-800/60'
                      }`}
                      style={{ width: `${item.boxW}px`, height: `${item.boxH}px` }}
                    />
                    <span className="text-xs font-medium font-mono">{item.ratio}</span>
                    <span className="text-[10px] text-slate-500 truncate mt-0.5">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Quick Presets Card (快捷提示詞推薦) */}
            <div className="rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-cyan-500/25 p-5 shadow-xl shadow-cyan-950/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
                    03
                  </div>
                  <h2 className="text-sm font-semibold tracking-wide text-white">快捷提示詞規劃</h2>
                </div>
                <span className="text-[11px] text-slate-400">一鍵套用</span>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
                {[
                  { id: 'all', label: '全部' },
                  { id: 'commercial', label: '📸 電商棚拍' },
                  { id: 'cinematic', label: '🎬 電影光影' },
                  { id: 'artistic', label: '🎨 風格藝術' },
                  { id: 'portrait', label: '✨ 人像精修' },
                  { id: 'repair', label: '🪄 消除補景' },
                  { id: 'scifi', label: '🌆 未來科幻' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setPresetCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
                      presetCategory === cat.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium'
                        : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Preset Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-h-56 overflow-y-auto pr-1">
                {filteredPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`group p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      activePresetId === preset.id
                        ? 'bg-cyan-500/15 border-cyan-400 shadow-sm shadow-cyan-500/20'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{preset.icon}</span>
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                          {preset.title}
                        </span>
                      </div>
                      {preset.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {preset.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{preset.subtitle}</p>
                  </button>
                ))}
              </div>

              {/* Quick Append Tags */}
              <div className="mt-3 pt-3 border-t border-slate-800/80">
                <p className="text-[11px] text-slate-400 mb-1.5">點擊追加細節標籤：</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAppendTag(tag)}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-slate-950 hover:bg-cyan-950/60 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-all"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Prompt Input & Execution Card */}
            <div className="rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-cyan-500/25 p-5 shadow-xl shadow-cyan-950/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
                    04
                  </div>
                  <h2 className="text-sm font-semibold tracking-wide text-white">自訂修改指令 (Prompt)</h2>
                </div>
                {customPrompt && (
                  <button
                    onClick={() => {
                      setCustomPrompt('');
                      setActivePresetId(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    清空
                  </button>
                )}
              </div>

              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="描述您希望如何修改圖片，例如：「將背景置換為深空星雲，添加青色柔光輪廓，增強整體主體細節」..."
                rows={4}
                className="w-full p-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-all resize-none font-sans"
              />

              {/* Model selection dropdown */}
              <div className="mt-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>核心模型：</span>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-cyan-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-cyan-400 font-mono"
                  >
                    <option value="gemini-2.5-flash-image">gemini-2.5-flash-image (推薦)</option>
                    <option value="gemini-3.1-flash-lite-image">gemini-3.1-flash-lite-image</option>
                  </select>
                </div>

                <span className="text-[11px] text-slate-500 font-mono">
                  {customPrompt.length} 字
                </span>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex flex-col gap-2 animate-shake">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                  <div className="pt-2 border-t border-rose-900/60 flex items-center justify-between">
                    <span className="text-[11px] text-rose-300/80">無需等待配額，立即體驗完整流程：</span>
                    <button
                      type="button"
                      onClick={handleSimulateGenerate}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] transition-all shadow-md"
                    >
                      以模擬渲染即刻體驗
                    </button>
                  </div>
                </div>
              )}

              {/* Main Generate Button Bar */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || !sourceImage}
                  className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-300 shadow-xl ${
                    isGenerating
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                      : !sourceImage
                      ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-800'
                      : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:via-blue-400 hover:to-indigo-500 text-slate-950 shadow-cyan-500/30 hover:shadow-cyan-400/50 hover:scale-[1.01]'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Gemini AI 運算重塑中 ({elapsedTimer.toFixed(1)}s)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 fill-slate-950" />
                      <span>開始生成修改圖片</span>
                    </>
                  )}
                </button>

                {sourceImage && !isGenerating && (
                  <button
                    type="button"
                    onClick={handleSimulateGenerate}
                    className="py-3.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400/50 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    title="立即在本地預覽模擬渲染效果（不消耗 API 配額）"
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>快速體驗</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: INTERACTIVE CANVAS & RESULTS ================= */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-cyan-500/25 p-5 shadow-xl shadow-cyan-950/20 min-h-[620px] flex flex-col">
              {/* Top Header of Result Card */}
              <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15 mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-wide text-white flex items-center gap-2">
                      工作畫布預覽
                      {resultImage && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          生成完成
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      即時比對 · 高清保存 · 雲端數據庫同步
                    </p>
                  </div>
                </div>

                {/* Save & Action Tools */}
                {resultImage && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Format Selector */}
                    <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-lg p-0.5 text-xs text-slate-300">
                      <span className="text-[10px] px-1 text-slate-400">格式:</span>
                      {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setSaveFormat(fmt)}
                          className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-mono transition-colors ${
                            saveFormat === fmt
                              ? 'bg-cyan-500/30 text-cyan-300 font-bold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>

                    {/* Copy to clipboard */}
                    <button
                      type="button"
                      onClick={handleCopyImage}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1 transition-all"
                      title="複製圖片至剪貼簿"
                    >
                      {copiedSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 text-[11px]">已複製</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px] hidden sm:inline">複製</span>
                        </>
                      )}
                    </button>

                    {/* Iterative editing button */}
                    <button
                      type="button"
                      onClick={handleUseAsNextInput}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-950/60 border border-slate-700 hover:border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-1 transition-all"
                      title="以此成果圖作為下一輪修改的底圖"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="text-[11px]">續修此圖</span>
                    </button>

                    {/* Primary Save Image Button */}
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/30 transition-all hover:scale-105"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>保存圖片</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Canvas Center Area */}
              <div className="flex-1 flex flex-col items-center justify-center relative">
                {isGenerating ? (
                  /* Cyber Holographic Loading State */
                  <div className="w-full h-full min-h-[420px] rounded-xl border border-cyan-500/30 bg-slate-950/60 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                    {/* Sci-fi scanner beam line */}
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#06b6d4] animate-bounce" />

                    <div className="relative mb-6">
                      <div className="w-24 h-24 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                      <div className="absolute inset-2 rounded-full border-2 border-fuchsia-500/20 border-b-fuchsia-400 animate-[spin_1.5s_linear_infinite_reverse]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-cyan-300 animate-pulse" />
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-white tracking-wide">
                      NEBULA 視覺重塑引擎處理中
                    </h4>
                    <p className="text-xs text-cyan-400 font-mono mt-1">
                      模型：{selectedModel} · 耗時 {elapsedTimer.toFixed(1)}s
                    </p>
                    <p className="text-[11px] text-slate-400 mt-3 max-w-sm text-center">
                      正在依據您的指令融合光影、重塑紋理並匹配 {selectedRatio} 構圖比例...
                    </p>
                  </div>
                ) : resultImage && sourceImage ? (
                  /* Completed Result with Interactive Comparison Slider */
                  <ImageComparisonSlider
                    originalImage={sourceImage}
                    editedImage={resultImage}
                    onDownload={handleDownload}
                    onFullscreen={() => setIsFullscreenModal(true)}
                  />
                ) : sourceImage ? (
                  /* Image uploaded, waiting for generation */
                  <div className="w-full h-full min-h-[420px] rounded-xl border border-slate-800 bg-slate-950/40 p-4 flex flex-col items-center justify-center relative">
                    <img
                      src={sourceImage}
                      alt="Source Ready"
                      className="max-h-[50vh] max-w-full object-contain rounded-lg shadow-xl border border-slate-700/60"
                    />
                    <div className="absolute bottom-6 px-4 py-2 rounded-full bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 text-xs font-medium text-cyan-300 flex items-center gap-2 shadow-2xl">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>原圖已就緒，請於左側設定修改指令後點選「開始生成」</span>
                    </div>
                  </div>
                ) : (
                  /* Blank Hologram Empty State */
                  <div className="w-full h-full min-h-[420px] rounded-xl border border-dashed border-slate-800/80 bg-slate-950/30 p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-4">
                      <ImageIcon className="w-8 h-8 text-cyan-500/40" />
                    </div>
                    <h4 className="text-base font-bold text-slate-300">畫布目前為空</h4>
                    <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                      請在左側上傳任何圖片（或點選內建樣圖），挑選畫面比例與快捷風格，Gemini 2.5 Flash Image 即時為您修改並呈現成果。
                    </p>

                    <div className="grid grid-cols-3 gap-3 mt-6 text-left max-w-md w-full">
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px]">
                        <span className="text-cyan-400 font-bold block mb-0.5">📸 商業棚拍</span>
                        <span className="text-slate-500">純白/大理石極簡去背與真實棚光</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px]">
                        <span className="text-purple-400 font-bold block mb-0.5">🎬 電影質感</span>
                        <span className="text-slate-500">雙色青橙光效與精美暗角景深</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px]">
                        <span className="text-emerald-400 font-bold block mb-0.5">💾 高清保存</span>
                        <span className="text-slate-500">自訂格式儲存與自動數據庫存檔</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Result Meta & Cloud DB status footer bar */}
              {resultMeta && (
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-cyan-300">
                      ⚡ 運算耗時：{(resultMeta.durationMs / 1000).toFixed(2)} 秒
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      核心：{resultMeta.modelUsed}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <Database className="w-3.5 h-3.5" />
                    <span>處理記錄已自動同步至數據庫</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Fullscreen Modal View */}
      {isFullscreenModal && resultImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <span className="text-cyan-300 font-bold">全螢幕檢視成果</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="px-3 py-1 bg-cyan-500 text-slate-950 font-semibold rounded-lg text-xs"
              >
                保存圖片
              </button>
              <button
                onClick={() => setIsFullscreenModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-200"
              >
                關閉 (ESC)
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img src={resultImage} alt="Full view" className="max-h-full max-w-full object-contain rounded-lg" />
          </div>
        </div>
      )}

      {/* History Database Drawer */}
      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        records={historyRecords}
        onReloadRecords={loadHistory}
        onSelectRecord={handleSelectHistoryRecord}
      />
    </div>
  );
}
