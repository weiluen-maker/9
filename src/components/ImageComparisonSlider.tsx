import React, { useState, useRef, useEffect } from 'react';
import { Columns2, Split, Eye, ZoomIn, ZoomOut, RotateCcw, Maximize2, Download } from 'lucide-react';

interface ImageComparisonSliderProps {
  originalImage: string;
  editedImage: string;
  originalLabel?: string;
  editedLabel?: string;
  onDownload?: () => void;
  onFullscreen?: () => void;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({
  originalImage,
  editedImage,
  originalLabel = '原圖 (Original)',
  editedLabel = 'AI 修改後 (Gemini 2.5)',
  onDownload,
  onFullscreen,
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'hold'>('slider');
  const [isHoldingOriginal, setIsHoldingOriginal] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef<boolean>(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    updateSlider(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updateSlider(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {
      // ignore
    }
  };

  const updateSlider = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  // Keyboard navigation for precision
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        setSliderPosition((prev) => Math.max(0, prev - 5));
      } else if (e.key === 'ArrowRight') {
        setSliderPosition((prev) => Math.min(100, prev + 5));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-cyan-500/15 flex-wrap gap-2 text-xs">
        {/* Mode switch tabs */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-900/80 border border-slate-700/60">
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium transition-all ${
              viewMode === 'slider'
                ? 'bg-cyan-500/20 text-cyan-300 shadow-sm shadow-cyan-500/20 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>對比滑塊</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-cyan-500/20 text-cyan-300 shadow-sm shadow-cyan-500/20 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>並列對比</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('hold')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium transition-all ${
              viewMode === 'hold'
                ? 'bg-cyan-500/20 text-cyan-300 shadow-sm shadow-cyan-500/20 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>按壓看原圖</span>
          </button>
        </div>

        {/* Zoom & Action Tools */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-900/80 border border-slate-700/60 rounded-lg p-0.5 text-slate-400">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
              disabled={zoom <= 0.75}
              className="p-1.5 hover:text-cyan-300 disabled:opacity-30 rounded hover:bg-slate-800"
              title="縮小"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[11px] text-slate-300 min-w-[40px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
              disabled={zoom >= 2.5}
              className="p-1.5 hover:text-cyan-300 disabled:opacity-30 rounded hover:bg-slate-800"
              title="放大"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoom !== 1 && (
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="p-1.5 hover:text-amber-400 rounded hover:bg-slate-800"
                title="重置縮放"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {onFullscreen && (
            <button
              type="button"
              onClick={onFullscreen}
              className="p-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-700/60 rounded-lg transition-colors"
              title="全螢幕檢視"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold rounded-lg shadow-lg shadow-cyan-500/25 transition-all text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>保存成果</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Visual Display */}
      <div className="relative flex-1 min-h-[360px] max-h-[70vh] w-full rounded-xl overflow-hidden border border-cyan-500/20 bg-slate-950/70 shadow-2xl flex items-center justify-center select-none">
        {/* Subtle checkered transparent pattern */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)',
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          }}
        />

        {/* MODE 1: SPLIT SLIDER */}
        {viewMode === 'slider' && (
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-ew-resize touch-none"
          >
            {/* Zoom Wrapper */}
            <div
              className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-100"
              style={{ transform: `scale(${zoom})` }}
            >
              {/* Edited image (Underneath / Right side) */}
              <img
                src={editedImage}
                alt={editedLabel}
                className="max-h-[64vh] max-w-full object-contain pointer-events-none rounded shadow-md"
              />

              {/* Original image (Overlay on Left side, clipped) */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <img
                  src={originalImage}
                  alt={originalLabel}
                  className="w-full h-full max-h-[64vh] max-w-full object-contain pointer-events-none rounded"
                />
              </div>

              {/* Divider Handle Line */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none flex items-center justify-center"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-[2px] h-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
                <div className="absolute w-8 h-8 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_16px_rgba(6,182,212,0.9)] text-cyan-300">
                  <Split className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Corner Badges */}
            <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-[11px] font-mono text-slate-300 pointer-events-none">
              ◀ {originalLabel}
            </div>
            <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-cyan-950/80 backdrop-blur-md border border-cyan-500/40 text-[11px] font-mono text-cyan-300 pointer-events-none">
              {editedLabel} ▶
            </div>
          </div>
        )}

        {/* MODE 2: SIDE BY SIDE */}
        {viewMode === 'side-by-side' && (
          <div className="w-full h-full p-3 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-auto">
            <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900/50 border border-slate-800">
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 border border-slate-700 text-[11px] text-slate-300 font-mono">
                {originalLabel}
              </span>
              <img
                src={originalImage}
                alt={originalLabel}
                className="max-h-[55vh] max-w-full object-contain rounded transition-transform"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
            <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-cyan-950/20 border border-cyan-500/30">
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-[11px] text-cyan-300 font-mono">
                {editedLabel}
              </span>
              <img
                src={editedImage}
                alt={editedLabel}
                className="max-h-[55vh] max-w-full object-contain rounded transition-transform"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
          </div>
        )}

        {/* MODE 3: HOLD TO VIEW ORIGINAL */}
        {viewMode === 'hold' && (
          <div
            onPointerDown={() => setIsHoldingOriginal(true)}
            onPointerUp={() => setIsHoldingOriginal(false)}
            onPointerLeave={() => setIsHoldingOriginal(false)}
            className="relative w-full h-full flex flex-col items-center justify-center cursor-pointer select-none"
          >
            <div
              className="relative max-h-full max-w-full flex items-center justify-center transition-transform"
              style={{ transform: `scale(${zoom})` }}
            >
              <img
                src={isHoldingOriginal ? originalImage : editedImage}
                alt="Hold Comparison"
                className="max-h-[64vh] max-w-full object-contain rounded shadow-lg"
              />
            </div>

            <div className="absolute bottom-4 px-4 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 text-xs font-medium text-cyan-200 flex items-center gap-2 shadow-xl animate-pulse">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>
                {isHoldingOriginal ? '鬆開即可查看 AI 修改成果' : '長按此處即可即時切換查看原圖'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
