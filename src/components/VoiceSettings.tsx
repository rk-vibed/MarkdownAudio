import React, { useState } from 'react';
import { VoiceName, VoiceOption, PreprocessingOptions } from '../types';
import { Volume2, Sparkles, Settings2, Loader2, Check } from 'lucide-react';

export const VOICES: VoiceOption[] = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Female',
    trait: 'Warm, Calm & Soothing',
    description: 'Articulate and gentle pacing, ideal for narrative reading, documentation, and long-form articles.',
    color: 'from-amber-500 to-rose-500',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Male',
    trait: 'Youthful & Dynamic',
    description: 'Bright, lively, and approachable. Excellent for tutorials, engaging podcasts, and explainers.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Male',
    trait: 'Deep & Cinematic',
    description: 'Resonant and authoritative tone, perfect for documentaries, dramatic prose, and executive briefs.',
    color: 'from-indigo-500 to-blue-600',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Male',
    trait: 'Bold & Spirited',
    description: 'Punchy and energetic cadence, great for presentations, highlights, and fast-paced guides.',
    color: 'from-orange-500 to-red-600',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Female',
    trait: 'Smooth & Clear',
    description: 'Crisp and balanced diction with neutral modern inflection. Great for technical manuals and guides.',
    color: 'from-cyan-500 to-sky-600',
  },
];

export const STYLE_PRESETS = [
  { label: 'Natural & Articulate', value: 'Clear, natural, well-paced and articulate' },
  { label: 'Audiobook Storyteller', value: 'Expressive audiobook narrator with warm nuance and emotional cadence' },
  { label: 'Tech Educator', value: 'Engaging, friendly educator explaining technical concepts clearly' },
  { label: 'Crisp Broadcaster', value: 'Professional, confident news anchor delivering a formal briefing' },
  { label: 'Calm & Mindful', value: 'Soothing, gentle, relaxed pace with peaceful cadence' },
];

interface VoiceSettingsProps {
  selectedVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  speechStyle: string;
  onStyleChange: (style: string) => void;
  selectedModel: 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts';
  onModelChange: (model: 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts') => void;
  preprocessingOptions: PreprocessingOptions;
  onPreprocessingChange: (options: PreprocessingOptions) => void;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  selectedVoice,
  onSelectVoice,
  speechStyle,
  onStyleChange,
  selectedModel,
  onModelChange,
  preprocessingOptions,
  onPreprocessingChange,
}) => {
  const [testingVoice, setTestingVoice] = useState<VoiceName | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const testVoiceSample = async (voice: VoiceName) => {
    try {
      setTestingVoice(voice);
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Hello! I am ${voice}, ready to read your markdown document with natural clarity.`,
          voice,
          style: speechStyle || 'Clear and natural',
          model: selectedModel,
        }),
      });
      const data = await res.json();
      if (data.audioBase64) {
        const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
        audio.play();
      }
    } catch (err) {
      console.error('Failed to audition voice:', err);
    } finally {
      setTestingVoice(null);
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm sm:text-base">Voice & Narration Persona</h3>
            <p className="text-xs text-slate-400">Select a natural Gemini voice and customize delivery style</p>
          </div>
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
            showAdvanced
              ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
              : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          {showAdvanced ? 'Hide Options' : 'Markdown Options'}
        </button>
      </div>

      {/* Voice cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {VOICES.map((v) => {
          const isSelected = selectedVoice === v.id;
          const isAuditioning = testingVoice === v.id;

          return (
            <div
              key={v.id}
              onClick={() => onSelectVoice(v.id)}
              className={`group relative text-left rounded-xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/90 border-indigo-500/80 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-950/40'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${v.color}`} />
                    <span className="font-semibold text-slate-100 text-sm">{v.name}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {v.gender}
                  </span>
                </div>
                <div className="text-[11px] font-medium text-indigo-300 mb-1">{v.trait}</div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">{v.description}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    testVoiceSample(v.id);
                  }}
                  disabled={isAuditioning}
                  className="px-2 py-1 rounded text-[11px] font-medium bg-slate-800/90 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 border border-slate-700 hover:border-indigo-500/30 transition-all flex items-center gap-1"
                  title="Audition voice"
                >
                  {isAuditioning ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                      <span>Auditioning...</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3 text-indigo-400" />
                      <span>Audition</span>
                    </>
                  )}
                </button>

                {isSelected && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                    <Check className="w-3 h-3" />
                    <span>Active</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Style & Tone controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-slate-800/80">
        <div className="md:col-span-8">
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Narration Style & Cadence
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {STYLE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => onStyleChange(p.value)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors border ${
                  speechStyle === p.value
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={speechStyle}
            onChange={(e) => onStyleChange(e.target.value)}
            placeholder="Custom style instructions (e.g. Enthusiastic teacher, warm audiobook narrator...)"
            className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950/80 border border-slate-700/80 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="md:col-span-4">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">TTS Engine Model</label>
          <div className="grid grid-cols-1 gap-1.5">
            <button
              type="button"
              onClick={() => onModelChange('gemini-3.8-flash-lite-tts')}
              className={`p-2 rounded-lg text-left text-xs border transition-all ${
                selectedModel === 'gemini-3.8-flash-lite-tts'
                  ? 'bg-indigo-950/40 border-indigo-500/60 text-indigo-200 ring-1 ring-indigo-500/30'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="font-semibold flex items-center justify-between">
                <span>gemini-3.8-flash-lite-tts</span>
                <span className="text-[10px] text-emerald-400 font-normal">Fast & Low Latency</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Optimized for high speed, long documents and reading.</p>
            </button>

            <button
              type="button"
              onClick={() => onModelChange('gemini-3.8-flash-tts')}
              className={`p-2 rounded-lg text-left text-xs border transition-all ${
                selectedModel === 'gemini-3.8-flash-tts'
                  ? 'bg-indigo-950/40 border-indigo-500/60 text-indigo-200 ring-1 ring-indigo-500/30'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="font-semibold flex items-center justify-between">
                <span>gemini-3.8-flash-tts</span>
                <span className="text-[10px] text-indigo-400 font-normal">Flagship Nuance</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Rich expressive prosody, vocal inflections, and tone styling.</p>
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Markdown Speech Options Drawer */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 bg-slate-950/40 rounded-xl p-3.5 border border-slate-800">
          <h4 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
            Markdown Speech Preprocessing Rules
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Code Blocks Handling</label>
              <select
                value={preprocessingOptions.codeBlockBehavior}
                onChange={(e) =>
                  onPreprocessingChange({
                    ...preprocessingOptions,
                    codeBlockBehavior: e.target.value as any,
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
              >
                <option value="summarize">Summarize (e.g. "[TypeScript snippet]")</option>
                <option value="skip">Omit Code Blocks Completely</option>
                <option value="read">Read Code Lines Aloud</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Markdown Links</label>
              <select
                value={preprocessingOptions.linkBehavior}
                onChange={(e) =>
                  onPreprocessingChange({
                    ...preprocessingOptions,
                    linkBehavior: e.target.value as any,
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
              >
                <option value="text-only">Read Link Anchor Text Only</option>
                <option value="read-domain">Read Text + Website Domain</option>
              </select>
            </div>

            <div className="flex flex-col justify-between">
              <label className="block text-slate-400 mb-1">Heading Narration</label>
              <div className="flex items-center gap-3 mt-1.5">
                <label className="inline-flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={preprocessingOptions.includeHeadings}
                    onChange={(e) =>
                      onPreprocessingChange({
                        ...preprocessingOptions,
                        includeHeadings: e.target.checked,
                      })
                    }
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Speak Headings</span>
                </label>

                {preprocessingOptions.includeHeadings && (
                  <label className="inline-flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={preprocessingOptions.headingPrefix}
                      onChange={(e) =>
                        onPreprocessingChange({
                          ...preprocessingOptions,
                          headingPrefix: e.target.checked,
                        })
                      }
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Add "Section:" Prefix</span>
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
