import React from 'react';
import { Sparkles, Database, Layers, Radio, Wand2, Cpu } from 'lucide-react';

interface HeaderProps {
  onOpenHistory: () => void;
  historyCount: number;
  particlesActive: boolean;
  onToggleParticles: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  historyCount,
  particlesActive,
  onToggleParticles,
}) => {
  return (
    <header className="relative z-20 border-b border-cyan-500/20 bg-slate-950/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="relative group flex items-center justify-center">
            {/* Ambient halo glow */}
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 opacity-60 blur-md group-hover:opacity-100 transition-opacity" />
            <div className="relative w-10 h-10 rounded-xl bg-[#0b0f1e] border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-inner">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-cyan-300 via-blue-200 to-fuchsia-300 bg-clip-text text-transparent font-['Plus_Jakarta_Sans']">
                NEBULA
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              AI 智能圖片修改工作站 · 視覺重塑引擎
            </p>
          </div>
        </div>

        {/* Model status & actions */}
        <div className="flex items-center gap-2.5">
          {/* Active Model Chip */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/30 text-xs shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>gemini-2.5-flash-image</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                免費額度
              </span>
            </div>
          </div>

          {/* Toggle Particles */}
          <button
            type="button"
            onClick={onToggleParticles}
            className={`p-2 rounded-xl border text-xs transition-all flex items-center gap-1.5 ${
              particlesActive
                ? 'bg-slate-900/90 border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={particlesActive ? '關閉背景漸層粒子' : '開啟背景漸層粒子'}
          >
            <Radio className="w-4 h-4" />
            <span className="hidden lg:inline text-[11px]">
              {particlesActive ? '粒子動效' : '靜態背景'}
            </span>
          </button>

          {/* History Database Drawer Button */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 border border-cyan-500/30 text-slate-200 text-xs font-medium shadow-lg hover:shadow-cyan-500/10 transition-all"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>歷史記錄</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {historyCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
