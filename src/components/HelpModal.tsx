import React from 'react';
import { X, BookOpen, Volume2, Sparkles, Layers, Sliders, Check } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-base">How MarkdownAudio Studio Works</h2>
              <p className="text-xs text-slate-400">A guide to natural voice synthesis and pronunciation customization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <h3 className="font-semibold text-indigo-300 text-sm mb-1 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              1. Custom Pronunciation Lexicon
            </h3>
            <p className="text-slate-400 mb-2">
              Default speech synthesizers often mispronounce acronyms (like "SQL" as "S-Q-L" or "k8s" as "k-eight-s")
              or foreign terms. With our pronunciation rules:
            </p>
            <ul className="space-y-1 text-slate-300">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Phonetic respellings:</strong> map <code className="text-indigo-300">SQL</code> to{' '}
                  <code className="text-emerald-300">Sequel</code>, or <code className="text-indigo-300">k8s</code> to{' '}
                  <code className="text-emerald-300">kay-eights</code>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>AI Term Scanner:</strong> click "Scan Document" in the Lexicon to automatically find tricky
                  terms in your Markdown and generate phonetic pronunciations.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Instant Audition:</strong> test any rule with a single click to hear how the selected voice
                  pronounces it.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <h3 className="font-semibold text-indigo-300 text-sm mb-1 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" />
              2. Natural Voice Models & Tone Direction
            </h3>
            <p className="text-slate-400 mb-2">
              Choose from 5 distinct Gemini voices (Kore, Puck, Charon, Fenrir, Zephyr) and customize emotional cadence
              or delivery style (e.g. "Warm Audiobook Narrator", "Tech Educator", or "Broadcaster").
            </p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <h3 className="font-semibold text-indigo-300 text-sm mb-1 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              3. Section-by-Section Synthesis & Master WAV Stitching
            </h3>
            <p className="text-slate-400 mb-2">
              Markdown files are intelligently split into sections based on your headings. You can convert individual
              sections or synthesize the entire document at once.
            </p>
            <p className="text-slate-400">
              When ready, click "Export WAV" in the bottom dock to download the seamlessly combined master audio file.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
          >
            Got it, let's convert!
          </button>
        </div>
      </div>
    </div>
  );
};
