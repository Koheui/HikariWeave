import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import type { AnalysisFrame } from '../audio/AudioEngine';

export const useAudioEngine = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisFrame | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const initialize = useCallback(async () => {
    try {
      if (!audioEngineRef.current) {
        audioEngineRef.current = new AudioEngine();
      }
      
      await audioEngineRef.current.initialize();
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize audio');
    }
  }, []);

  const startMicrophone = useCallback(async () => {
    if (!audioEngineRef.current) {
      throw new Error('Audio engine not initialized');
    }
    
    try {
      await audioEngineRef.current.startMicrophone();
      setIsPlaying(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start microphone');
    }
  }, []);

  const loadAudioFile = useCallback(async (file: File) => {
    if (!audioEngineRef.current) {
      throw new Error('Audio engine not initialized');
    }
    
    try {
      await audioEngineRef.current.loadAudioFile(file);
      setIsPlaying(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audio file');
    }
  }, []);

  const stop = useCallback(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.stop();
    }
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const updateAnalysis = useCallback(() => {
    if (!audioEngineRef.current || !isPlaying) return;

    try {
      const newAnalysis = audioEngineRef.current.getAnalysisFrame();
      setAnalysis(newAnalysis);
    } catch (err) {
      console.error('Analysis error:', err);
    }

    animationFrameRef.current = requestAnimationFrame(updateAnalysis);
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      updateAnalysis();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, updateAnalysis]);

  useEffect(() => {
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.dispose();
      }
    };
  }, []);

  return {
    audioEngineRef,
    isInitialized,
    isPlaying,
    analysis,
    error,
    initialize,
    startMicrophone,
    loadAudioFile,
    stop,
    setFFTSize: audioEngineRef.current?.setFFTSize.bind(audioEngineRef.current)
  };
};
