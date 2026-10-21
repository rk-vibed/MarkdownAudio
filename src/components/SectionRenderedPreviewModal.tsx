import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import {
  MarkdownSpeechSection,
  PronunciationRule,
  VoiceName,
} from '../types';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Eye,
  FileText,
  Volume2,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Minimize2,
  Maximize2,
  Move,
  Layers,
  Settings2,
  Clock,
} from 'lucide-react';

interface SectionRenderedPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: MarkdownSpeechSection | null;
  currentIndex: number;
  totalSections: number;
  isPlaying: boolean;
  onPlaySection: (sectionId: string) => void;
  onPause: () => void;
  onNextSection: () => void;
  onPrevSection: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  autoPopup: boolean;
  onToggleAutoPopup: () => void;
  activeRules: PronunciationRule[];
  selectedVoice: VoiceName;
  onSynthesizeSection?: (sectionId: string) => void;
}

export const SectionRenderedPreviewModal: React.FC<SectionRenderedPreviewModalProps> = ({
  isOpen,
  onClose,
  section,
  currentIndex,
  totalSections,
  isPlaying,
  onPlaySection,
  onPause,
  onNextSection,
  onPrevSection,
  hasNext,
  hasPrev,
  autoPopup,
  onToggleAutoPopup,
  activeRules,
  selectedVoice,
  onSynthesizeSection,
}) => {
  const [viewMode, setViewMode] = useState<'rendered' | 'spoken' | 'raw'>('rendered');
  const [layoutMode, setLayoutMode] = useState<'floating' | 'modal'>('floating');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Render markdown to HTML
  const renderedHtml = useMemo(() => {
    if (!section || !section.rawMarkdown) {
      return '<p class="text-slate-400 italic">No content available for this section.</p>';
    }
    try {
      return marked.parse(section.rawMarkdown);
    } catch {
      return '<p class="text-rose-400">Failed to render markdown preview.</p>';
    }
  }, [section?.rawMarkdown]);

  // Word count and stats
  const wordCount = useMemo(() => {
    if (!section?.rawMarkdown) return 0;
    return section.rawMarkdown.trim().split(/\s+/).filter(Boolean).length;
  }, [section?.rawMarkdown]);

  // Highlighted spoken text with pronunciation rules
  const renderHighlightedSpeechText = (text: string) => {
    if (!text) return <span className="text-slate-500 italic">No spoken script generated</span>;

    const replacements = activeRules
      .filter((r) => r.enabled && r.replacement.trim())
      .map((r) => ({
        word: r.word,
        replacement: r.replacement,
        category: r.category,
      }));

    if (replacements.length === 0) {
      return <span>{text}</span>;
    }

    const sorted = [...replacements].sort((a, b) => b.replacement.length - a.replacement.length);
    const escapedReplacements = sorted.map((s) => s.replacement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`(${escapedReplacements.join('|')})`, 'gi');
    const parts = text.split(pattern);

    return (
      <span className="leading-relaxed">
        {parts.map((part, i) => {
          const match = sorted.find((r) => r.replacement.toLowerCase() === part.toLowerCase());
          if (match) {
            return (
              <span
                key={i}
                className="inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded bg-indigo-950/90 text-indigo-200 border border-indigo-500/50 font-medium text-xs shadow-sm"
                title={`Spoken as: "${match.replacement}" (from dictionary term "${match.word}")`}
              >
                <span>{part}</span>
                <span className="text-[10px] text-indigo-400 uppercase font-mono tracking-tight">[{match.word}]</span>
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  if (!isOpen || !section) return null;

  // Minimized floating bar version
  if (isMinimized) {
    return (
      <div className="fixed bottom-24 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-indigo-500/40 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            {isPlaying ? (
              <div className="flex items-end gap-0.5 h-3.5">
                <span className="w-1 bg-indigo-400 rounded-full animate-pulse h-3" />
                <span className="w-1 bg-indigo-400 rounded-full animate-pulse h-4" />
                <span className="w-1 bg-indigo-400 rounded-full animate-pulse h-2" />
              </div>
            ) : (
              <Eye className="w-4 h-4 text-indigo-300" />
            )}
          </div>

          <div className="min-w-0 max-w-[200px] sm:max-w-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono px-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                Sec {currentIndex + 1}/{totalSections}
              </span>
              <span className="text-xs font-semibold text-slate-100 truncate">{section.title}</span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">Rendered preview minimized</p>
          </div>

          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-800 pl-2">
            <button
              onClick={() => (isPlaying ? onPause() : onPlaySection(section.id))}
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Expand Rendered Preview"
            >
              <Maximize2 className="w-3.5 h-3.5 text-indigo-300" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
              title="Close Preview"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Wrapper container based on layoutMode
  const containerClass =
    layoutMode === 'modal'
      ? 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200'
      : 'fixed bottom-24 right-3 sm:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-[540px] md:w-[600px] max-h-[calc(100vh-8.5rem)] flex flex-col animate-in fade-in slide-in-from-bottom-3 duration-200';

  const cardClass =
    layoutMode === 'modal'
      ? 'w-full max-w-2xl max-h-[85vh] flex flex-col bg-slate-900/98 border border-indigo-500/40 rounded-2xl shadow-2xl backdrop-blur-xl ring-1 ring-white/10 overflow-hidden'
      : 'w-full flex-1 flex flex-col bg-slate-900/95 border border-indigo-500/40 rounded-2xl shadow-2xl backdrop-blur-xl ring-1 ring-white/10 overflow-hidden';

  return (
    <div className={containerClass}>
      <div className={cardClass}>
        {/* Top Header Bar */}
        <div className="shrink-0 px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-indigo-500/20 flex items-center justify-between gap-3">
          {/* Section Indicator & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
              {isPlaying ? (
                <div className="flex items-end gap-0.5 h-3.5">
                  <span className="w-1 bg-emerald-400 rounded-full animate-pulse h-3" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-pulse h-4" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-pulse h-2" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-pulse h-3.5" />
                </div>
              ) : (
                <Eye className="w-4 h-4 text-indigo-300" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold tracking-wider uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                  {isPlaying ? 'Playing Now' : 'Section Preview'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                  {currentIndex + 1} / {totalSections}
                </span>
                {section.level > 0 && (
                  <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700">
                    H{section.level}
                  </span>
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate mt-0.5" title={section.title}>
                {section.title}
              </h3>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Auto-popup toggle */}
            <button
              onClick={onToggleAutoPopup}
              className={`px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors hidden sm:flex items-center gap-1.5 ${
                autoPopup
                  ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40 hover:bg-indigo-900/60'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-300'
              }`}
              title={
                autoPopup
                  ? 'Auto-popup on play is ENABLED (click to disable)'
                  : 'Auto-popup on play is DISABLED (click to enable)'
              }
            >
              <span className={`w-1.5 h-1.5 rounded-full ${autoPopup ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span>Auto-popup</span>
            </button>

            {/* Layout mode switcher: Floating Corner vs Center Modal */}
            <button
              onClick={() => setLayoutMode(layoutMode === 'floating' ? 'modal' : 'floating')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title={layoutMode === 'floating' ? 'Expand to Center Modal' : 'Dock to Floating Corner'}
            >
              <Move className="w-3.5 h-3.5" />
            </button>

            {/* Minimize toggle (only in floating mode) */}
            {layoutMode === 'floating' && (
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Minimize preview bar"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
              title="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View mode navigation tabs & meta info */}
        <div className="shrink-0 px-4 py-2 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between gap-2 text-xs">
          <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            <button
              onClick={() => setViewMode('rendered')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'rendered'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Rendered Preview</span>
            </button>
            <button
              onClick={() => setViewMode('spoken')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'spoken'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Volume2 className="w-3 h-3" />
              <span>Spoken Script (TTS)</span>
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'raw'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Markdown Source</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="hidden sm:inline">{wordCount} words</span>
            {section.duration && (
              <span className="flex items-center gap-1 text-emerald-400 font-mono">
                <Clock className="w-3 h-3" />
                <span>{Math.round(section.duration)}s</span>
              </span>
            )}
          </div>
        </div>

        {/* Body Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-950/70 min-h-[160px] max-h-[380px] sm:max-h-[460px] selection:bg-indigo-500/30">
          {viewMode === 'rendered' && (
            <div className="rendered-markdown-content text-slate-200 text-sm leading-relaxed prose prose-invert max-w-none prose-headings:text-indigo-200 prose-headings:font-bold prose-code:text-indigo-300 prose-code:bg-slate-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800">
              <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
            </div>
          )}

          {viewMode === 'spoken' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                {renderHighlightedSpeechText(section.spokenText)}
              </div>
              <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>
                  Highlighted words have custom pronunciation rules applied from the dictionary.
                </span>
              </div>
            </div>
          )}

          {viewMode === 'raw' && (
            <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {section.rawMarkdown}
            </pre>
          )}

          {/* Section Synthesis Notification if needed */}
          {section.status === 'generating' && (
            <div className="mt-3 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-2.5 text-xs text-indigo-200">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
              <span>Generating speech audio using voice <strong>{selectedVoice}</strong>...</span>
            </div>
          )}

          {section.status === 'error' && (
            <div className="mt-3 p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{section.error || 'Failed to generate audio for this section'}</span>
              </div>
              {onSynthesizeSection && (
                <button
                  onClick={() => onSynthesizeSection(section.id)}
                  className="px-2 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-white font-medium"
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom Playback Toolbar */}
        <div className="shrink-0 px-4 py-2.5 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevSection}
              disabled={!hasPrev}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors"
              title="Previous section"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (isPlaying) {
                  onPause();
                } else {
                  onPlaySection(section.id);
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white flex items-center gap-2 shadow-md shadow-indigo-950/50 font-medium text-xs transition-all active:scale-95"
              title={isPlaying ? 'Pause section' : 'Play section audio'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 ml-0.5" />
                  <span>Play Section</span>
                </>
              )}
            </button>

            <button
              onClick={onNextSection}
              disabled={!hasNext}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors"
              title="Next section"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Voice: <strong className="text-slate-200">{selectedVoice}</strong>
            </span>
            {section.status === 'ready' && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                <span>Audio Ready</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
