import React from 'react';
import { Headphones, BookOpen, Volume2, Sparkles, HelpCircle, FileText, FolderOpen } from 'lucide-react';
import { VoiceName } from '../types';

interface HeaderProps {
  selectedVoice: VoiceName;
  activeRulesCount: number;
  onOpenDictionary: () => void;
  onOpenDirectoryBrowser: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedVoice,
  activeRulesCount,
  onOpenDictionary,
  onOpenDirectoryBrowser,
  onOpenHelp,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-950/50">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                MarkdownAudio Studio
              </h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Natural TTS
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Convert Markdown into expressive spoken audio with custom pronunciation rules
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenDirectoryBrowser}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-indigo-500/40 text-xs font-medium flex items-center gap-2 transition-all shadow-sm"
            title="Browse and select Markdown files from a directory"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Browse Directory</span>
            <span className="inline sm:hidden">Folder</span>
          </button>

          <button
            onClick={onOpenDictionary}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-indigo-500/40 text-xs font-medium flex items-center gap-2 transition-all shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Pronunciation Lexicon</span>
            <span className="inline sm:hidden">Pronunciation</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
              {activeRulesCount}
            </span>
          </button>

          <button
            onClick={onOpenHelp}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-xl border border-slate-800 transition-colors"
            title="How it works & pronunciation guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
