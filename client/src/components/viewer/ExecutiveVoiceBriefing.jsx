import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Square,
  Sparkles,
  Copy,
  Check,
  Download,
  Mic,
  Settings2,
  Zap,
  Radio,
  FileText,
  Clock,
  ShieldAlert
} from 'lucide-react';

export const ExecutiveVoiceBriefing = ({
  documentName = "Agreement",
  riskScore = 78,
  overallRisk = "HIGH",
  voiceScript = "",
  estimatedDuration = 58
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const utteranceRef = useRef(null);
  const timerRef = useRef(null);

  // Fallback default script if not provided
  const defaultScript = voiceScript || (
    `Here is your 60-second executive summary for ${documentName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}. ` +
    `Overall contract risk is assessed as ${overallRisk} with a score of ${riskScore} out of 100. ` +
    `The two critical items to note are the mandatory auto-renewal cancellation window and unilateral terms modification rights. ` +
    `To avoid automated financial lock-in, make sure to deliver written non-renewal notice well before the contractual cutoff date. ` +
    `We strongly recommend reviewing our AI redline counter-proposals before signing. Briefing complete.`
  );

  // Split into readable sentences for live synchronization
  const sentences = defaultScript
    .split(/(?<=[.?!])\s+/)
    .filter(s => s.trim().length > 0);

  // Load available speech synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length > 0) {
        // Prioritize natural English voices
        const englishVoices = allVoices.filter(v => v.lang.startsWith('en'));
        const listToUse = englishVoices.length > 0 ? englishVoices : allVoices;
        setVoices(listToUse);

        // Try to pick a natural sounding voice by default
        const bestDefaultIdx = listToUse.findIndex(v =>
          v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel') ||
          v.name.includes('Zira') ||
          v.name.includes('Guy')
        );
        if (bestDefaultIdx >= 0) {
          setSelectedVoiceIndex(bestDefaultIdx);
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer ticker
  useEffect(() => {
    if (isPlaying && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => {
          if (prev >= estimatedDuration) {
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isPaused, estimatedDuration]);

  const handlePlay = (startSentenceIdx = 0) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const textToRead = sentences.slice(startSentenceIdx).join(' ');
    const utterance = new SpeechSynthesisUtterance(textToRead);

    if (voices[selectedVoiceIndex]) {
      utterance.voice = voices[selectedVoiceIndex];
    }
    utterance.rate = playbackRate;
    utterance.pitch = 1.0;

    // Track sentence progression via boundary events or estimation
    let currentWordCount = 0;
    const totalWords = textToRead.split(/\s+/).length;
    
    utterance.onboundary = (event) => {
      if (event.name === 'sentence' || event.name === 'word') {
        const charIdx = event.charIndex;
        let cumulative = 0;
        for (let i = startSentenceIdx; i < sentences.length; i++) {
          cumulative += sentences[i].length + 1;
          if (charIdx < cumulative) {
            setCurrentSentenceIndex(i);
            break;
          }
        }
      }
    };

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      if (startSentenceIdx === 0) {
        setElapsedSeconds(0);
      }
      setCurrentSentenceIndex(startSentenceIdx);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSentenceIndex(-1);
      setElapsedSeconds(estimatedDuration);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis utterance error:', e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePauseResume = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } else {
      handlePlay();
    }
  };

  const handleStop = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSentenceIndex(-1);
    setElapsedSeconds(0);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(defaultScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([defaultScript], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${documentName.replace(/[^a-zA-Z0-9]/g, '_')}_Executive_Voice_Brief.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format seconds mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-cream-300 p-6 shadow-xs space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-200">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-burgundy-800 to-burgundy-950 text-cream-100 flex items-center justify-center shadow-xs">
            <Mic className="w-5 h-5 text-cream-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-burgundy-100 text-burgundy-900 border border-burgundy-200">
                AI Executive Voice Briefing
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">60-Second Audio Narration</span>
            </div>
            <h3 className="text-base font-extrabold text-burgundy-950 mt-0.5">
              Audio Risk Briefing for {documentName}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyScript}
            className="px-3 py-1.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-burgundy-900 text-xs font-bold transition-colors flex items-center gap-1.5 border border-cream-300 shadow-2xs"
            title="Copy voice script to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Script'}</span>
          </button>
          <button
            onClick={handleDownloadScript}
            className="px-3 py-1.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-burgundy-900 text-xs font-bold transition-colors flex items-center gap-1.5 border border-cream-300 shadow-2xs"
            title="Download text script"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save .txt</span>
          </button>
        </div>
      </div>

      {/* Main Player Visualizer Deck */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-burgundy-950 via-navy-900 to-burgundy-900 text-cream-50 space-y-6 shadow-md shadow-burgundy-950/20">
        
        {/* Animated Waveform Equalizer Display */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cream-200">
              {isPlaying && !isPaused ? 'Synthesizing Verbal Brief...' : isPaused ? 'Audio Paused' : 'Ready to Play'}
            </span>
          </div>

          <div className="flex items-center gap-1 font-mono text-xs text-cream-200 bg-white/10 px-3 py-1 rounded-full border border-white/15">
            <Clock className="w-3.5 h-3.5 text-cream-300" />
            <span>{formatTime(elapsedSeconds)} / {formatTime(estimatedDuration)}</span>
          </div>
        </div>

        {/* Dynamic Waveform Visualizer Bars */}
        <div className="h-14 flex items-end justify-center gap-1.5 sm:gap-2 px-4 py-2 bg-black/25 rounded-xl border border-white/10 overflow-hidden">
          {[18, 35, 60, 85, 45, 70, 95, 40, 80, 55, 90, 65, 30, 85, 50, 75, 40, 95, 60, 35, 70, 50, 80, 45].map((h, i) => (
            <div
              key={i}
              className={`w-1.5 sm:w-2 rounded-full transition-all duration-150 ${
                isPlaying && !isPaused
                  ? 'bg-gradient-to-t from-cream-300 to-rose-400 animate-pulse'
                  : 'bg-white/20'
              }`}
              style={{
                height: isPlaying && !isPaused ? `${Math.max(15, (h * (0.6 + ((i % 4) * 0.15))))}%` : '15%',
                animationDelay: `${i * 60}ms`
              }}
            />
          ))}
        </div>

        {/* Audio Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (isPlaying ? handlePauseResume() : handlePlay(0))}
              className="w-12 h-12 rounded-2xl bg-cream-100 hover:bg-white text-burgundy-950 font-bold flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              {isPlaying && !isPaused ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={handleStop}
              disabled={!isPlaying && !isPaused}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-cream-100 disabled:opacity-30 transition-colors"
              title="Stop audio"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={() => handlePlay(0)}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-cream-100 transition-colors"
              title="Replay from start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Speed & Voice Selection */}
          <div className="flex items-center gap-3">
            {/* Speed Toggle */}
            <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/15">
              {[0.9, 1.0, 1.25, 1.5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackRate(spd)}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                    playbackRate === spd ? 'bg-cream-100 text-burgundy-950 shadow-xs' : 'text-cream-200 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Voice Accent Picker */}
            {voices.length > 0 && (
              <select
                value={selectedVoiceIndex}
                onChange={(e) => setSelectedVoiceIndex(Number(e.target.value))}
                className="bg-white/10 border border-white/20 text-cream-50 text-xs rounded-xl px-2.5 py-2 focus:outline-none max-w-[160px] truncate"
              >
                {voices.map((v, idx) => (
                  <option key={idx} value={idx} className="text-slate-900 bg-white">
                    {v.name.replace(/Microsoft|Google|Apple/g, '').trim()} ({v.lang})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Synchronized Read-Along Interactive Transcript */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-burgundy-900 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-rose-600" />
            Synchronized Read-Along Briefing Transcript
          </h4>
          <span className="text-[11px] text-slate-400">Click any sentence to jump narration</span>
        </div>

        <div className="p-5 rounded-2xl bg-cream-50/70 border border-cream-200 space-y-2 text-xs sm:text-sm leading-relaxed text-slate-700">
          {sentences.map((sentence, idx) => {
            const isCurrent = currentSentenceIndex === idx;
            return (
              <span
                key={idx}
                onClick={() => handlePlay(idx)}
                className={`cursor-pointer transition-all duration-200 inline-block mr-1.5 p-1 rounded-lg ${
                  isCurrent
                    ? 'bg-burgundy-800 text-cream-50 font-semibold shadow-xs ring-2 ring-burgundy-400/30'
                    : 'hover:bg-cream-200/80'
                }`}
              >
                {sentence}{' '}
              </span>
            );
          })}
        </div>
      </div>

      {!isSupported && (
        <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
          Note: Your browser does not support Web Speech synthesizer API. Please use Google Chrome, Edge, or Safari to listen to spoken AI voice briefing.
        </p>
      )}
    </div>
  );
};
