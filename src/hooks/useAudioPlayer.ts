import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '../stores/playerStore.js';

export function useAudioPlayer(audioUrl: string | null | undefined) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const waveformBufferRef = useRef<Float32Array | null>(null);
  const initRef = useRef(false);

  const {
    setPlaying, setCurrentTime, setDuration, setVolume, setPlaybackRate,
  } = usePlayerStore();

  useEffect(() => {
    if (!audioUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }

    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = audioUrl;
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
      setCurrentTime(0);
      if (audioCtxRef.current && !sourceRef.current) {
        try {
          const source = audioCtxRef.current.createMediaElementSource(audio);
          const analyser = audioCtxRef.current.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyser.connect(audioCtxRef.current.destination);
          sourceRef.current = source;
          analyserRef.current = analyser;
        } catch (e) {
          console.warn('[AudioPlayer] MediaElementSource already created or error:', e);
        }
      }
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('play', () => {
      setPlaying(true);
      if (!audioCtxRef.current) {
        try {
          const ctx = new AudioContext();
          audioCtxRef.current = ctx;
          if (!sourceRef.current) {
            const source = ctx.createMediaElementSource(audio);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyser.connect(ctx.destination);
            sourceRef.current = source;
            analyserRef.current = analyser;
          }
        } catch (e) {
          console.warn('[AudioPlayer] AudioContext init error:', e);
        }
      }
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    });

    audio.addEventListener('pause', () => {
      setPlaying(false);
    });

    audio.addEventListener('ended', () => {
      setPlaying(false);
      setCurrentTime(0);
    });

    audio.addEventListener('error', (e) => {
      console.error('[AudioPlayer] Audio load error:', e);
      console.error('[AudioPlayer] Failed URL:', audioUrl);
    });

    const vol = usePlayerStore.getState().volume;
    audio.volume = vol;
    audio.playbackRate = usePlayerStore.getState().playbackRate;

    initRef.current = false;

    return () => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audioRef.current = null;
      if (sourceRef.current) {
        try { sourceRef.current.disconnect(); } catch {}
        sourceRef.current = null;
      }
      analyserRef.current = null;
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch {}
        audioCtxRef.current = null;
      }
      initRef.current = false;
    };
  }, [audioUrl]);

  useEffect(() => {
    const unsub = usePlayerStore.subscribe((state, prevState) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (state.isPlaying !== prevState.isPlaying) {
        if (state.isPlaying) {
          if (audioCtxRef.current?.state === 'suspended') {
            audioCtxRef.current.resume();
          }
          audio.play().catch(e => {
            console.warn('[AudioPlayer] play() failed:', e);
            setPlaying(false);
          });
        } else {
          audio.pause();
        }
      }

      if (state.volume !== prevState.volume) {
        audio.volume = state.volume;
      }

      if (state.playbackRate !== prevState.playbackRate) {
        audio.playbackRate = state.playbackRate;
      }
    });
    return unsub;
  }, []);

  const seekAudio = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio && isFinite(time)) {
      audio.currentTime = Math.max(0, Math.min(audio.duration || time, time));
      setCurrentTime(audio.currentTime);
    }
  }, []);

  const fetchWaveformData = useCallback(async (): Promise<Float32Array | null> => {
    if (waveformBufferRef.current) return waveformBufferRef.current;

    const url = audioUrl;
    if (!url) return null;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioCtx = new AudioContext({ sampleRate: 22050 });
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      audioCtx.close();

      const rawData = audioBuffer.getChannelData(0);
      const targetSamples = Math.min(2000, rawData.length);
      const blockSize = Math.floor(rawData.length / targetSamples);
      const waveform = new Float32Array(targetSamples);

      for (let i = 0; i < targetSamples; i++) {
        let sum = 0;
        const start = i * blockSize;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[start + j] || 0);
        }
        waveform[i] = sum / blockSize;
      }

      waveformBufferRef.current = waveform;
      return waveform;
    } catch (e) {
      console.warn('[AudioPlayer] Waveform decode failed, using fallback:', e);
      return null;
    }
  }, [audioUrl]);

  const getAnalyserData = useCallback((): Uint8Array | null => {
    if (!analyserRef.current) return null;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    return data;
  }, []);

  return {
    seekAudio,
    fetchWaveformData,
    getAnalyserData,
    audioRef,
  };
}
