import React, { useState, useMemo, useEffect } from 'react';
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
  Clock,
  AlignLeft,
  Columns,
  ZoomIn,
  ZoomOut,
  Table,
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
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [readingMeasure, setReadingMeasure] = useState<'optimal' | 'full'>('optimal');
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large'>('normal');

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Render markdown to HTML and wrap tables with scrollable container
  const { renderedHtml, hasTable } = useMemo(() => {
    if (!section || !section.rawMarkdown) {
      return {
        renderedHtml: '<p class="text-slate-400 italic">No content available for this section.</p>',
        hasTable: false,
      };
    }
    try {
      let rawHtml = marked.parse(section.rawMarkdown) as string;
      const containsTable = /<table/i.test(rawHtml);

      // Wrap HTML tables in a custom styled horizontal scroll container with table badge
      if (containsTable) {
        rawHtml = rawHtml.replace(
          /<table([^>]*)>/gi,
          '<div class="table-outer-wrapper my-5 rounded-2xl border border-indigo-500/25 bg-slate-900/80 shadow-xl overflow-hidden">' +
            '<div class="table-scroll-container overflow-x-auto w-full custom-scrollbar">' +
            '<table class="min-w-full w-full border-collapse text-left"$1>'
        );
        rawHtml = rawHtml.replace(/<\/table>/gi, '</table></div></div>');
      }

      return {
        renderedHtml: rawHtml,
        hasTable: containsTable,
      };
    } catch {
      return {
        renderedHtml: '<p class="text-rose-400">Failed to render markdown preview.</p>',
        hasTable: false,
      };
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
                className="inline-flex items-center gap-1 mx-0.5 px-2 py-0.5 rounded bg-indigo-950/90 text-indigo-200 border border-indigo-500/50 font-medium text-xs shadow-sm"
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

  // Minimized floating pill version
  if (isMinimized) {
    return (
      <div className="fixed bottom-24 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-indigo-500/40 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            {isPlaying ? (
              <div className="flex items-end gap-0.5 h-3.5">
                <span className="w-1 bg-emerald-400 rounded-full animate-pulse h-3" />
                <span className="w-1 bg-emerald-400 rounded-full animate-pulse h-4" />
                <span className="w-1 bg-emerald-400 rounded-full animate-pulse h-2" />
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
              title="Expand Rendered Preview to 80% Center Modal"
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

  // Centered Modal covering 80% of width
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 lg:p-8 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[94vw] sm:w-[86vw] lg:w-[80vw] max-w-[1440px] h-[86vh] max-h-[920px] flex flex-col bg-slate-900/98 border border-indigo-500/40 rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 overflow-hidden"
      >
        {/* Top Header Bar */}
        <div className="shrink-0 px-4 sm:px-6 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-indigo-500/20 flex items-center justify-between gap-3">
          {/* Section Indicator & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
              {isPlaying ? (
                <div className="flex items-end gap-0.5 h-4">
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                  {isPlaying ? 'Playing Now' : 'Rendered Section Preview'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                  Section {currentIndex + 1} of {totalSections}
                </span>
                {section.level > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700">
                    Heading Level {section.level}
                  </span>
                )}
                {hasTable && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-medium">
                    <Table className="w-3 h-3" />
                    <span>Table Present</span>
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-100 truncate mt-0.5" title={section.title}>
                {section.title}
              </h2>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Auto-popup toggle */}
            <button
              onClick={onToggleAutoPopup}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors hidden md:flex items-center gap-1.5 ${
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

            {/* Reading measure toggle (Optimal comfortable reading measure vs Full 80% width) */}
            <button
              onClick={() => setReadingMeasure(readingMeasure === 'optimal' ? 'full' : 'optimal')}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors hidden sm:flex items-center gap-1.5 ${
                readingMeasure === 'optimal'
                  ? 'bg-slate-800 text-slate-200 border-slate-700'
                  : 'bg-indigo-950/70 text-indigo-300 border-indigo-500/40'
              }`}
              title={
                readingMeasure === 'optimal'
                  ? 'Comfortable Reading Measure active (prevents eye strain on long lines while tables use full width)'
                  : 'Full 80% container width for all text lines'
              }
            >
              {readingMeasure === 'optimal' ? (
                <>
                  <AlignLeft className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Reading: Comfortable</span>
                </>
              ) : (
                <>
                  <Columns className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Reading: Full 80% Width</span>
                </>
              )}
            </button>

            {/* Font size toggle */}
            <button
              onClick={() => setFontSizeLevel(fontSizeLevel === 'normal' ? 'large' : 'normal')}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title={fontSizeLevel === 'normal' ? 'Switch to Larger Font Size' : 'Switch to Standard Font Size'}
            >
              {fontSizeLevel === 'normal' ? <ZoomIn className="w-4 h-4" /> : <ZoomOut className="w-4 h-4 text-indigo-300" />}
            </button>

            {/* Minimize toggle */}
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Minimize preview to floating bar"
            >
              <Minimize2 className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition-colors"
              title="Close preview (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View mode navigation tabs & meta info */}
        <div className="shrink-0 px-4 sm:px-6 py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex rounded-xl bg-slate-950 p-0.5 border border-slate-800">
            <button
              onClick={() => setViewMode('rendered')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'rendered'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Rendered Preview</span>
            </button>
            <button
              onClick={() => setViewMode('spoken')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'spoken'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Spoken Script (TTS)</span>
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'raw'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Markdown Source</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="hidden sm:inline">
              <strong className="text-slate-200">{wordCount}</strong> words
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="text-slate-400">
              Modal Width: <strong className="text-indigo-300">80% Viewport</strong>
            </span>
            {section.duration && (
              <>
                <span className="hidden sm:inline text-slate-600">•</span>
                <span className="flex items-center gap-1 text-emerald-400 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{Math.round(section.duration)}s</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Body Content Area - Formatted with high legibility */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 md:p-9 bg-slate-950/80 custom-scrollbar selection:bg-indigo-500/30">
          {viewMode === 'rendered' && (
            <div
              className={`mx-auto w-full ${
                readingMeasure === 'optimal' ? 'max-w-5xl' : 'max-w-none'
              }`}
            >
              <div
                className={`rendered-markdown-content text-slate-100 ${
                  fontSizeLevel === 'large'
                    ? 'text-base sm:text-lg leading-relaxed sm:leading-8'
                    : 'text-[15px] sm:text-base leading-relaxed sm:leading-7'
                }`}
              >
                <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
              </div>
            </div>
          )}

          {viewMode === 'spoken' && (
            <div
              className={`mx-auto w-full space-y-4 ${
                readingMeasure === 'optimal' ? 'max-w-5xl' : 'max-w-none'
              }`}
            >
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm sm:text-base text-slate-100 leading-relaxed font-sans shadow-inner">
                {renderHighlightedSpeechText(section.spokenText)}
              </div>
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs sm:text-sm text-indigo-300 flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  Words displayed in badges have custom phonetic or pronunciation dictionary replacements applied.
                </span>
              </div>
            </div>
          )}

          {viewMode === 'raw' && (
            <div
              className={`mx-auto w-full ${
                readingMeasure === 'optimal' ? 'max-w-5xl' : 'max-w-none'
              }`}
            >
              <pre className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs sm:text-sm font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                {section.rawMarkdown}
              </pre>
            </div>
          )}

          {/* Section Synthesis Notification if needed */}
          {section.status === 'generating' && (
            <div className="mt-4 p-4 rounded-2xl bg-indigo-950/50 border border-indigo-500/40 flex items-center gap-3 text-sm text-indigo-200">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400 shrink-0" />
              <span>
                Synthesizing speech audio for this section with voice <strong>{selectedVoice}</strong>...
              </span>
            </div>
          )}

          {section.status === 'error' && (
            <div className="mt-4 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-between text-sm text-rose-300">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{section.error || 'Failed to generate audio for this section'}</span>
              </div>
              {onSynthesizeSection && (
                <button
                  onClick={() => onSynthesizeSection(section.id)}
                  className="px-3 py-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-white font-medium text-xs transition-colors"
                >
                  Retry Synthesis
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom Playback Toolbar */}
        <div className="shrink-0 px-4 sm:px-6 py-3 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={onPrevSection}
              disabled={!hasPrev}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors border border-slate-800 hover:border-slate-700 flex items-center gap-1.5 text-xs font-medium"
              title="Previous section"
            >
              <SkipBack className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <button
              onClick={() => {
                if (isPlaying) {
                  onPause();
                } else {
                  onPlaySection(section.id);
                }
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white flex items-center gap-2.5 shadow-lg shadow-indigo-950/50 font-semibold text-xs sm:text-sm transition-all active:scale-95"
              title={isPlaying ? 'Pause section' : 'Play section audio'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Section</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 ml-0.5" />
                  <span>Play Section Audio</span>
                </>
              )}
            </button>

            <button
              onClick={onNextSection}
              disabled={!hasNext}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors border border-slate-800 hover:border-slate-700 flex items-center gap-1.5 text-xs font-medium"
              title="Next section"
            >
              <span className="hidden sm:inline">Next</span>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-400">
              Active Voice: <strong className="text-indigo-200">{selectedVoice}</strong>
            </span>
            {section.status === 'ready' && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Audio Ready</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
