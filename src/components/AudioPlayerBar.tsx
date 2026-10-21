import React, { useRef, useState, useEffect } from 'react';
import { MarkdownSpeechSection } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Download,
  Repeat,
  Radio,
  Sliders,
} from 'lucide-react';
import { stitchWavClips } from '../utils/audioConcat';

interface AudioPlayerBarProps {
  sections: MarkdownSpeechSection[];
  activeSectionId: string | null;
  isPlaying: boolean;
  onPlaySection: (sectionId: string) => void;
  onPause: () => void;
  onNextSection: () => void;
  onPrevSection: () => void;
  continuousPlay: boolean;
  onToggleContinuousPlay: () => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  sections,
  activeSectionId,
  isPlaying,
  onPlaySection,
  onPause,
  onNextSection,
  onPrevSection,
  continuousPlay,
  onToggleContinuousPlay,
  playbackRate,
  onPlaybackRateChange,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isStitching, setIsStitching] = useState(false);

  // Active section data
  const activeSection = sections.find((s) => s.id === activeSectionId) || null;
  const activeIndex = sections.findIndex((s) => s.id === activeSectionId);
  const readySections = sections.filter((s) => s.status === 'ready' && s.audioBase64);

  // Update audio source when active section changes
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      if (continuousPlay && activeIndex < sections.length - 1) {
        onNextSection();
      } else {
        onPause();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [continuousPlay, activeIndex, sections.length, onNextSection, onPause]);

  // Handle play/pause and source updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (activeSection?.audioBase64) {
      const srcUrl = `data:audio/wav;base64,${activeSection.audioBase64}`;
      if (audio.src !== srcUrl) {
        audio.src = srcUrl;
        audio.playbackRate = playbackRate;
        audio.volume = isMuted ? 0 : volume;
      }

      if (isPlaying) {
        audio.play().catch((e) => console.error('Audio play error:', e));
      } else {
        audio.pause();
      }
    } else {
      audio.pause();
    }
  }, [activeSection, isPlaying, playbackRate, volume, isMuted]);

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = Number(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleToggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const handleDownloadFullDocument = async () => {
    if (readySections.length === 0) return;
    try {
      setIsStitching(true);
      const clips = readySections.map((s) => s.audioBase64!);
      const { blob, blobUrl } = stitchWavClips(clips);
      const fileName = `markdown_full_audiobook_${Date.now()}.wav`;

      // Persist to server disk directory ./audio_output
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64data = (reader.result as string)?.split(',')[1];
          if (base64data) {
            await fetch('/api/audio/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileName,
                audioBase64: base64data,
                outputDir: './audio_output',
              }),
            });
          }
        };
        reader.readAsDataURL(blob);
      } catch (e) {
        console.warn('Could not save master audio to local disk:', e);
      }

      // Trigger browser download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Failed to stitch WAV files:', err);
    } finally {
      setIsStitching(false);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800 backdrop-blur-xl px-4 py-3 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Track information & Waveform */}
        <div className="flex items-center gap-3 w-full md:w-1/4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            {isPlaying ? (
              <div className="flex items-end gap-0.5 h-4">
                <span className="w-1 bg-indigo-400 rounded-full animate-pulse h-3" />
                <span className="w-1 bg-indigo-400 rounded-full animate-pulse h-4" />
                <span className="w-1 bg-indigo-400 rounded-full animate-pulse h-2" />
                <span className="w-1 bg-indigo-400 rounded-full animate-pulse h-4" />
              </div>
            ) : (
              <Radio className="w-5 h-5 text-indigo-400" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                {activeIndex >= 0 ? `Sec ${activeIndex + 1}/${sections.length}` : 'Audio Player'}
              </span>
              <span className="text-xs font-semibold text-slate-100 truncate">
                {activeSection ? activeSection.title : 'Ready to play'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {activeSection
                ? activeSection.spokenText.slice(0, 45) + '...'
                : `${readySections.length} of ${sections.length} sections ready`}
            </p>
          </div>
        </div>

        {/* Playback Controls & Timeline Slider */}
        <div className="flex flex-col items-center gap-1.5 w-full md:w-2/4">
          {/* Buttons row */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleContinuousPlay}
              className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 ${
                continuousPlay
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
              title={continuousPlay ? 'Continuous autoplay ON' : 'Continuous autoplay OFF'}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden sm:inline">Autoplay</span>
            </button>

            <button
              onClick={onPrevSection}
              disabled={activeIndex <= 0}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors"
              title="Previous section"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleSkip(-5)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs font-medium"
              title="Rewind 5s"
            >
              -5s
            </button>

            <button
              onClick={() => {
                if (isPlaying) {
                  onPause();
                } else if (activeSection) {
                  onPlaySection(activeSection.id);
                } else if (readySections.length > 0) {
                  onPlaySection(readySections[0].id);
                }
              }}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-950/50 transition-transform active:scale-95"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <button
              onClick={() => handleSkip(5)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs font-medium"
              title="Fast forward 5s"
            >
              +5s
            </button>

            <button
              onClick={onNextSection}
              disabled={activeIndex >= sections.length - 1}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors"
              title="Next section"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Speed pills */}
            <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5 ml-2">
              {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => onPlaybackRateChange(rate)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    playbackRate === rate
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Scrub bar */}
          <div className="w-full flex items-center gap-2 text-[10px] text-slate-400 font-mono">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Master Audio Download */}
        <div className="flex items-center justify-end gap-3 w-full md:w-1/4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMute}
              className="text-slate-400 hover:text-slate-200 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <button
            onClick={handleDownloadFullDocument}
            disabled={readySections.length === 0 || isStitching}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/90 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 disabled:opacity-40"
            title="Combine and export all synthesized audio as a single WAV file"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">
              {isStitching ? 'Exporting...' : `Export WAV (${readySections.length})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
