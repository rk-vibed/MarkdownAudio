import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  VoiceName,
  PronunciationRule,
  MarkdownSpeechSection,
  PreprocessingOptions,
} from './types';
import { DEFAULT_PRONUNCIATION_RULES } from './utils/pronunciation';
import {
  DEFAULT_PREPROCESSING_OPTIONS,
  parseMarkdownSections,
} from './utils/markdownSpeech';
import { SAMPLE_DOCS } from './utils/sampleDocs';
import { Header } from './components/Header';
import { VoiceSettings } from './components/VoiceSettings';
import { MarkdownEditor } from './components/MarkdownEditor';
import { SpeechInspector } from './components/SpeechInspector';
import { PronunciationDictionaryModal } from './components/PronunciationDictionaryModal';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { HelpModal } from './components/HelpModal';
import { DirectoryBrowserModal } from './components/DirectoryBrowserModal';

export default function App() {
  // Markdown state initialized with rich tech sample
  const [markdown, setMarkdown] = useState<string>(() => {
    const saved = localStorage.getItem('md_audio_markdown');
    return saved !== null ? saved : SAMPLE_DOCS[0].content;
  });

  // Pronunciation rules state
  const [rules, setRules] = useState<PronunciationRule[]>(() => {
    try {
      const saved = localStorage.getItem('md_audio_rules');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load saved pronunciation rules:', e);
    }
    return DEFAULT_PRONUNCIATION_RULES;
  });

  // Voice & Narration styling
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(() => {
    return (localStorage.getItem('md_audio_voice') as VoiceName) || 'Kore';
  });

  const [speechStyle, setSpeechStyle] = useState<string>(() => {
    return (
      localStorage.getItem('md_audio_style') ||
      'Clear, natural, well-paced and articulate'
    );
  });

  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts'>(
    'gemini-3.8-flash-lite-tts'
  );

  const [preprocessingOptions, setPreprocessingOptions] = useState<PreprocessingOptions>(() => {
    try {
      const saved = localStorage.getItem('md_audio_preprocessing');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PREPROCESSING_OPTIONS;
  });

  // Audio playback state
  const [sections, setSections] = useState<MarkdownSpeechSection[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [continuousPlay, setContinuousPlay] = useState<boolean>(true);
  const [isSynthesizingAll, setIsSynthesizingAll] = useState<boolean>(false);

  // Modals state
  const [showDictionary, setShowDictionary] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showDirectoryBrowser, setShowDirectoryBrowser] = useState<boolean>(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('md_audio_markdown', markdown);
  }, [markdown]);

  useEffect(() => {
    localStorage.setItem('md_audio_rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('md_audio_voice', selectedVoice);
  }, [selectedVoice]);

  useEffect(() => {
    localStorage.setItem('md_audio_style', speechStyle);
  }, [speechStyle]);

  useEffect(() => {
    localStorage.setItem('md_audio_preprocessing', JSON.stringify(preprocessingOptions));
  }, [preprocessingOptions]);

  // Synchronize parsed sections when markdown, rules, or options change
  useEffect(() => {
    const parsed = parseMarkdownSections(markdown, preprocessingOptions, rules);

    setSections((prevSections) => {
      // Preserve existing audio if section raw markdown and spoken text did not change
      return parsed.map((newSec) => {
        const existing = prevSections.find((p) => p.id === newSec.id || (p.title === newSec.title && p.rawMarkdown === newSec.rawMarkdown));
        if (existing && existing.spokenText === newSec.spokenText && existing.status === 'ready') {
          return {
            ...newSec,
            id: existing.id,
            status: 'ready',
            audioBase64: existing.audioBase64,
            duration: existing.duration,
          };
        }
        return newSec;
      });
    });
  }, [markdown, preprocessingOptions, rules]);

  // Reset to default pronunciation rules
  const handleResetDefaults = () => {
    if (confirm('Reset all custom pronunciation rules to the default dictionary?')) {
      setRules(DEFAULT_PRONUNCIATION_RULES);
    }
  };

  // Measure audio duration helper
  const calculateAudioDuration = (audioBase64: string): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration || 0);
      });
      audio.addEventListener('error', () => {
        resolve(0);
      });
    });
  };

  // Synthesize single section
  const handleSynthesizeSection = async (sectionId: string, autoPlayAfter = false) => {
    const sec = sections.find((s) => s.id === sectionId);
    if (!sec || !sec.spokenText.trim()) return;

    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, status: 'generating', error: undefined } : s))
    );

    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sec.spokenText,
          voice: selectedVoice,
          style: speechStyle,
          model: selectedModel,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.audioBase64) {
        throw new Error(data.error || 'Failed to synthesize speech');
      }

      const duration = await calculateAudioDuration(data.audioBase64);

      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                status: 'ready',
                audioBase64: data.audioBase64,
                duration,
                error: undefined,
              }
            : s
        )
      );

      if (autoPlayAfter) {
        setActiveSectionId(sectionId);
        setIsPlaying(true);
      }
    } catch (err: any) {
      console.error('Synthesis failed:', err);
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? { ...s, status: 'error', error: err?.message || 'Synthesis failed' }
            : s
        )
      );
    }
  };

  // Synthesize all sections sequentially
  const handleSynthesizeAll = async () => {
    if (sections.length === 0 || isSynthesizingAll) return;
    setIsSynthesizingAll(true);

    for (const sec of sections) {
      // If already ready, continue
      if (sec.status === 'ready' && sec.audioBase64) continue;

      setSections((prev) =>
        prev.map((s) => (s.id === sec.id ? { ...s, status: 'generating', error: undefined } : s))
      );

      try {
        const res = await fetch('/api/tts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: sec.spokenText,
            voice: selectedVoice,
            style: speechStyle,
            model: selectedModel,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.audioBase64) {
          throw new Error(data.error || 'Synthesis error');
        }

        const duration = await calculateAudioDuration(data.audioBase64);

        setSections((prev) =>
          prev.map((s) =>
            s.id === sec.id
              ? {
                  ...s,
                  status: 'ready',
                  audioBase64: data.audioBase64,
                  duration,
                  error: undefined,
                }
              : s
          )
        );
      } catch (err: any) {
        console.error(`Failed to synthesize section ${sec.title}:`, err);
        setSections((prev) =>
          prev.map((s) =>
            s.id === sec.id
              ? { ...s, status: 'error', error: err?.message || 'Synthesis failed' }
              : s
          )
        );
      }
    }

    setIsSynthesizingAll(false);
  };

  // Playback handlers
  const handlePlaySection = (sectionId: string) => {
    const sec = sections.find((s) => s.id === sectionId);
    if (!sec) return;

    if (sec.status === 'ready' && sec.audioBase64) {
      setActiveSectionId(sectionId);
      setIsPlaying(true);
    } else {
      // Auto-synthesize then play
      handleSynthesizeSection(sectionId, true);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleNextSection = useCallback(() => {
    const currIndex = sections.findIndex((s) => s.id === activeSectionId);
    if (currIndex >= 0 && currIndex < sections.length - 1) {
      const nextSec = sections[currIndex + 1];
      handlePlaySection(nextSec.id);
    } else {
      setIsPlaying(false);
    }
  }, [sections, activeSectionId]);

  const handlePrevSection = useCallback(() => {
    const currIndex = sections.findIndex((s) => s.id === activeSectionId);
    if (currIndex > 0) {
      const prevSec = sections[currIndex - 1];
      handlePlaySection(prevSec.id);
    }
  }, [sections, activeSectionId]);

  // Handle file selected from directory browser
  const handleSelectFileFromDirectory = (
    content: string,
    fileName: string,
    autoSynthesize = false
  ) => {
    setMarkdown(content);
    setActiveFileName(fileName);
    if (autoSynthesize) {
      setTimeout(() => {
        handleSynthesizeAll();
      }, 200);
    }
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden selection:bg-indigo-500/30">
      {/* Top Navigation */}
      <Header
        selectedVoice={selectedVoice}
        activeRulesCount={rules.filter((r) => r.enabled).length}
        onOpenDictionary={() => setShowDictionary(true)}
        onOpenDirectoryBrowser={() => setShowDirectoryBrowser(true)}
        onOpenSettings={() => setShowVoiceSettings(true)}
        onOpenHelp={() => setShowHelp(true)}
      />

      {/* Main Studio Body - Covers complete available height */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 pt-3 pb-24 flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Active file indicator if loaded from directory */}
        {activeFileName && (
          <div className="shrink-0 mb-2.5 flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-400">Active Document from Directory:</span>
              <strong className="text-indigo-200 font-mono">{activeFileName}</strong>
            </div>
            <button
              onClick={() => setShowDirectoryBrowser(true)}
              className="text-indigo-300 hover:text-white underline text-[11px]"
            >
              Change file
            </button>
          </div>
        )}

        {/* Dual Workstation: Markdown Editor (Left) & Speech/Audio Inspector (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0 h-full overflow-hidden">
          <MarkdownEditor
            markdown={markdown}
            onChange={(val) => {
              setMarkdown(val);
              setActiveFileName(null);
            }}
            sectionCount={sections.length}
            onOpenDirectoryBrowser={() => setShowDirectoryBrowser(true)}
          />

          <SpeechInspector
            sections={sections}
            activeSectionId={activeSectionId}
            isPlaying={isPlaying}
            onPlaySection={handlePlaySection}
            onPause={handlePause}
            onSynthesizeSection={handleSynthesizeSection}
            onSynthesizeAll={handleSynthesizeAll}
            isSynthesizingAll={isSynthesizingAll}
            activeRules={rules}
            selectedVoice={selectedVoice}
            onOpenDictionary={() => setShowDictionary(true)}
            onOpenSettings={() => setShowVoiceSettings(true)}
          />
        </div>
      </main>

      {/* Docked Audio Player & Timeline */}
      <AudioPlayerBar
        sections={sections}
        activeSectionId={activeSectionId}
        isPlaying={isPlaying}
        onPlaySection={handlePlaySection}
        onPause={handlePause}
        onNextSection={handleNextSection}
        onPrevSection={handlePrevSection}
        continuousPlay={continuousPlay}
        onToggleContinuousPlay={() => setContinuousPlay(!continuousPlay)}
        playbackRate={playbackRate}
        onPlaybackRateChange={setPlaybackRate}
      />

      {/* Voice & Narration Settings Modal (Gear Icon) */}
      <VoiceSettings
        isOpen={showVoiceSettings}
        onClose={() => setShowVoiceSettings(false)}
        selectedVoice={selectedVoice}
        onSelectVoice={setSelectedVoice}
        speechStyle={speechStyle}
        onStyleChange={setSpeechStyle}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        preprocessingOptions={preprocessingOptions}
        onPreprocessingChange={setPreprocessingOptions}
      />

      {/* Directory Browser Modal */}
      <DirectoryBrowserModal
        isOpen={showDirectoryBrowser}
        onClose={() => setShowDirectoryBrowser(false)}
        onSelectFile={handleSelectFileFromDirectory}
      />

      {/* Pronunciation Lexicon Modal */}
      <PronunciationDictionaryModal
        isOpen={showDictionary}
        onClose={() => setShowDictionary(false)}
        rules={rules}
        onUpdateRules={setRules}
        activeMarkdownText={markdown}
        selectedVoice={selectedVoice}
        onResetDefaults={handleResetDefaults}
      />

      {/* Help Modal */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
