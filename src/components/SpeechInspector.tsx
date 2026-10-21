import React from 'react';
import { MarkdownSpeechSection, PronunciationRule, VoiceName } from '../types';
import {
  Play,
  Pause,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Download,
  BookOpen,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface SpeechInspectorProps {
  sections: MarkdownSpeechSection[];
  activeSectionId: string | null;
  isPlaying: boolean;
  onPlaySection: (sectionId: string) => void;
  onPause: () => void;
  onSynthesizeSection: (sectionId: string) => void;
  onSynthesizeAll: () => void;
  isSynthesizingAll: boolean;
  activeRules: PronunciationRule[];
  selectedVoice: VoiceName;
  onOpenDictionary: () => void;
}

export const SpeechInspector: React.FC<SpeechInspectorProps> = ({
  sections,
  activeSectionId,
  isPlaying,
  onPlaySection,
  onPause,
  onSynthesizeSection,
  onSynthesizeAll,
  isSynthesizingAll,
  activeRules,
  selectedVoice,
  onOpenDictionary,
}) => {
  const readyCount = sections.filter((s) => s.status === 'ready').length;
  const totalCount = sections.length;

  // Render text with highlighted pronunciation replacements
  const renderHighlightedSpeechText = (text: string) => {
    if (!text) return <span className="text-slate-500 italic">No text for this section</span>;

    // Build replacement lookup
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

    // Split text or highlight replacement occurrences
    // Sort replacements by descending length to match longest first
    const sorted = [...replacements].sort((a, b) => b.replacement.length - a.replacement.length);
    const escapedReplacements = sorted.map((s) => s.replacement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`(${escapedReplacements.join('|')})`, 'gi');

    const parts = text.split(pattern);

    return (
      <span>
        {parts.map((part, i) => {
          const match = sorted.find((r) => r.replacement.toLowerCase() === part.toLowerCase());
          if (match) {
            return (
              <span
                key={i}
                className="inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 font-medium text-[11px] group relative cursor-help"
                title={`Spoken as: "${match.replacement}" (from custom rule "${match.word}")`}
              >
                <span>{part}</span>
                <span className="text-[9px] text-indigo-400/80 uppercase font-mono">[{match.word}]</span>
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  const handleDownloadSectionAudio = async (sec: MarkdownSpeechSection) => {
    if (!sec.audioBase64) return;
    const cleanName = `${sec.title.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'section'}.wav`;

    // Persist to local server directory ./audio_output
    try {
      await fetch('/api/audio/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: cleanName,
          audioBase64: sec.audioBase64,
          outputDir: './audio_output',
        }),
      });
    } catch (e) {
      console.warn('Could not save section to local disk:', e);
    }

    // Trigger browser download
    const a = document.createElement('a');
    a.href = `data:audio/wav;base64,${sec.audioBase64}`;
    a.download = cleanName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl flex flex-col shadow-xl backdrop-blur-md overflow-hidden h-[540px]">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-xs sm:text-sm flex items-center gap-2">
              <span>Speech Sections & Pronunciation</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                {readyCount}/{totalCount} Synthesized
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDictionary}
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700/80 flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Pronunciation Rules</span>
            <span className="text-[10px] bg-indigo-950 px-1.5 rounded-full border border-indigo-500/30 text-indigo-200">
              {activeRules.filter((r) => r.enabled).length}
            </span>
          </button>

          <button
            onClick={onSynthesizeAll}
            disabled={isSynthesizingAll || totalCount === 0}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-950/40 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            {isSynthesizingAll ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                <span>Synthesize All ({totalCount})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/50">
        {sections.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Volume2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-slate-400">No markdown sections yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Add headings and text in the Markdown Editor to parse speech sections.
            </p>
          </div>
        ) : (
          sections.map((sec, idx) => {
            const isActive = activeSectionId === sec.id;
            const isCurrentlyPlaying = isActive && isPlaying;
            const isBusy = sec.status === 'generating';

            return (
              <div
                key={sec.id}
                className={`group rounded-xl p-3.5 border transition-all ${
                  isActive
                    ? 'bg-slate-900/95 border-indigo-500 shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-500/40'
                    : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                {/* Section Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono font-semibold text-slate-400 flex items-center justify-center border border-slate-700">
                      {idx + 1}
                    </span>
                    <h4 className="font-semibold text-slate-200 text-xs sm:text-sm line-clamp-1">{sec.title}</h4>
                    {sec.level > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700">
                        H{sec.level}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    {sec.status === 'ready' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready</span>
                        {sec.duration && (
                          <span className="text-emerald-500/80 ml-0.5 font-mono">({Math.round(sec.duration)}s)</span>
                        )}
                      </span>
                    )}

                    {sec.status === 'generating' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-500/30">
                        <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                        <span>Synthesizing...</span>
                      </span>
                    )}

                    {sec.status === 'error' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-500/20">
                        <AlertCircle className="w-3 h-3" />
                        <span>Failed</span>
                      </span>
                    )}

                    {sec.status === 'idle' && (
                      <span className="text-[11px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}

                    {/* Action buttons */}
                    {sec.status === 'ready' && (
                      <>
                        <button
                          type="button"
                          onClick={() => (isCurrentlyPlaying ? onPause() : onPlaySection(sec.id))}
                          className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
                            isCurrentlyPlaying
                              ? 'bg-indigo-600 text-white border-indigo-500'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          }`}
                          title={isCurrentlyPlaying ? 'Pause section' : 'Play section audio'}
                        >
                          {isCurrentlyPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadSectionAudio(sec)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                          title="Download section WAV"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => onSynthesizeSection(sec.id)}
                      disabled={isBusy}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-slate-700 hover:border-indigo-500/40 text-[11px] font-medium transition-all flex items-center gap-1 disabled:opacity-50"
                      title="Synthesize audio for this section"
                    >
                      {sec.status === 'ready' ? (
                        <>
                          <RefreshCw className="w-3 h-3" />
                          <span>Regen</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          <span>Convert</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Spoken Text with Highlighted Pronunciation */}
                <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 font-sans">
                  {renderHighlightedSpeechText(sec.spokenText)}
                </div>

                {sec.error && (
                  <p className="text-[11px] text-rose-400 mt-2 bg-rose-950/20 p-2 rounded border border-rose-900/30">
                    {sec.error}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span>Natural Voice: {selectedVoice}</span>
        </span>
        <span className="text-slate-500">
          Tip: Words in <span className="text-indigo-300 font-mono">[brackets]</span> have custom pronunciation applied
        </span>
      </div>
    </div>
  );
};
