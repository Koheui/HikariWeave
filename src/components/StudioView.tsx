import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { WebGLRenderer } from '../webgl/WebGLRenderer';
import { ModMatrix } from '../audio/ModMatrix';
import { LivePresets } from '../audio/LivePresets';
import { PresetSelector } from './PresetSelector';
import { CodeOverlay } from './CodeOverlay';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { EventQueue } from '../audio/EventQueue';
import { StrokeWeaveRenderer } from '../webgl/StrokeWeaveRenderer';
import { JellyfishPulsesRenderer } from '../webgl/JellyfishPulsesRenderer';
import { NeuralCircuitRenderer } from '../webgl/NeuralCircuitRenderer';
import { VolcanicCoreRenderer } from '../webgl/VolcanicCoreRenderer';
import { CrystalLoomRenderer } from '../webgl/CrystalLoomRenderer';
import { PaintFlowRenderer } from '../webgl/PaintFlowRenderer';
import type { AnalysisFrame, AudioEvent } from '../audio/AudioEngine';

interface StudioViewProps {
  appState: any;
  onStateChange: (newState: any) => void;
}

export const StudioView: React.FC<StudioViewProps> = ({ appState, onStateChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webglRendererRef = useRef<WebGLRenderer | null>(null);
  const strokeWeaveRef = useRef<StrokeWeaveRenderer | null>(null);
  const jellyfishPulsesRef = useRef<JellyfishPulsesRenderer | null>(null);
  const neuralCircuitRef = useRef<NeuralCircuitRenderer | null>(null);
  const volcanicCoreRef = useRef<VolcanicCoreRenderer | null>(null);
  const crystalLoomRef = useRef<CrystalLoomRenderer | null>(null);
  const paintFlowRef = useRef<PaintFlowRenderer | null>(null);
  const modMatrixRef = useRef<ModMatrix>(new ModMatrix());
  const eventQueueRef = useRef<EventQueue>(new EventQueue(1.5));
  const animationFrameRef = useRef<number | null>(null);
  
  const [currentRenderer, setCurrentRenderer] = useState<'jellyfish' | 'neural' | 'volcanic' | 'crystal' | 'paintflow'>('paintflow');
  
  const audioEngine = useAudioEngine();

  useEffect(() => {
    const initializeRenderers = () => {
      if (canvasRef.current) {
        try {
          // Initialize all renderers
          if (!jellyfishPulsesRef.current) {
            jellyfishPulsesRef.current = new JellyfishPulsesRenderer(canvasRef.current);
            console.log('JellyfishPulsesRenderer initialized');
          }
          if (!neuralCircuitRef.current) {
            neuralCircuitRef.current = new NeuralCircuitRenderer(canvasRef.current);
            console.log('NeuralCircuitRenderer initialized');
          }
          if (!volcanicCoreRef.current) {
            volcanicCoreRef.current = new VolcanicCoreRenderer(canvasRef.current);
            console.log('VolcanicCoreRenderer initialized');
          }
          if (!crystalLoomRef.current) {
            crystalLoomRef.current = new CrystalLoomRenderer(canvasRef.current);
            console.log('CrystalLoomRenderer initialized');
          }
          if (!paintFlowRef.current) {
            paintFlowRef.current = new PaintFlowRenderer(canvasRef.current);
            console.log('PaintFlowRenderer initialized');
          }
          
          // Apply default preset only if not already set
          if (!appState.activePreset) {
            const defaultPreset = LivePresets.getBeamPreset();
            LivePresets.applyPresetToModMatrix(modMatrixRef.current, defaultPreset);
            onStateChange({ activePreset: defaultPreset });
            console.log('Default preset applied:', defaultPreset.name);
          }
          
        } catch (error) {
          console.error('Failed to initialize renderers:', error);
        }
      } else {
        // Retry after a short delay if canvas is not ready
        setTimeout(initializeRenderers, 100);
      }
    };
    
    initializeRenderers();
  }, []); // Empty dependency array to run only once

  useEffect(() => {
    const animate = () => {
      // Always render, even without audio
      switch (currentRenderer) {
        case 'jellyfish':
          if (jellyfishPulsesRef.current) {
            // Get audio analysis if available
            const analysisFrame = audioEngine.audioEngineRef?.current?.getAnalysisFrame?.() as AnalysisFrame;
            if (analysisFrame) {
              // Process onsets into events
              const events: AudioEvent[] = [];
              for (const onset of analysisFrame.onsets) {
                events.push({
                  t: analysisFrame.time,
                  band: onset.band,
                  energy: onset.energy,
                  pitch: analysisFrame.pitch,
                  centroid: analysisFrame.centroid
                });
              }
              
              // Push events to queue
              for (const event of events) {
                eventQueueRef.current.push(event);
              }
              
              // Get events for this frame
              const currentTime = analysisFrame.time;
              const frameEvents = eventQueueRef.current.popSince(currentTime - 0.016, currentTime);
              
              jellyfishPulsesRef.current.update(0.016, frameEvents, analysisFrame);
            } else {
              // Render without audio data
              jellyfishPulsesRef.current.update(0.016, [], {
                time: Date.now() / 1000,
                rms: 0,
                low: 0,
                mid: 0,
                high: 0,
                centroid: 0,
                onsets: [],
                beatPhase: 0,
                bassDrum: 0,
                snare: 0,
                hihat: 0,
                kick: 0,
                vocal: 0,
                melody: 0,
                hue: 0,
                saturation: 0,
                brightness: 0
              });
            }
            try {
              jellyfishPulsesRef.current.render();
            } catch (error) {
              console.error('JellyfishPulsesRenderer render error:', error);
            }
          }
          break;
        case 'neural':
          if (neuralCircuitRef.current) {
            const analysisFrame = audioEngine.audioEngineRef?.current?.getAnalysisFrame?.() as AnalysisFrame;
            if (analysisFrame) {
              const events: AudioEvent[] = [];
              for (const onset of analysisFrame.onsets) {
                events.push({
                  t: analysisFrame.time,
                  band: onset.band,
                  energy: onset.energy,
                  pitch: analysisFrame.pitch,
                  centroid: analysisFrame.centroid
                });
              }
              for (const event of events) {
                eventQueueRef.current.push(event);
              }
              const currentTime = analysisFrame.time;
              const frameEvents = eventQueueRef.current.popSince(currentTime - 0.016, currentTime);
              neuralCircuitRef.current.update(0.016, frameEvents, analysisFrame);
            } else {
              neuralCircuitRef.current.update(0.016, [], {
                time: Date.now() / 1000,
                rms: 0,
                low: 0,
                mid: 0,
                high: 0,
                centroid: 0,
                onsets: [],
                beatPhase: 0,
                bassDrum: 0,
                snare: 0,
                hihat: 0,
                kick: 0,
                vocal: 0,
                melody: 0,
                hue: 0,
                saturation: 0,
                brightness: 0
              });
            }
            try {
              neuralCircuitRef.current.render();
            } catch (error) {
              console.error('NeuralCircuitRenderer render error:', error);
            }
          }
          break;
        case 'volcanic':
          if (volcanicCoreRef.current) {
            const analysisFrame = audioEngine.audioEngineRef?.current?.getAnalysisFrame?.() as AnalysisFrame;
            if (analysisFrame) {
              const events: AudioEvent[] = [];
              for (const onset of analysisFrame.onsets) {
                events.push({
                  t: analysisFrame.time,
                  band: onset.band,
                  energy: onset.energy,
                  pitch: analysisFrame.pitch,
                  centroid: analysisFrame.centroid
                });
              }
              for (const event of events) {
                eventQueueRef.current.push(event);
              }
              const currentTime = analysisFrame.time;
              const frameEvents = eventQueueRef.current.popSince(currentTime - 0.016, currentTime);
              volcanicCoreRef.current.update(0.016, frameEvents, analysisFrame);
            } else {
              volcanicCoreRef.current.update(0.016, [], {
                time: Date.now() / 1000,
                rms: 0,
                low: 0,
                mid: 0,
                high: 0,
                centroid: 0,
                onsets: [],
                beatPhase: 0,
                bassDrum: 0,
                snare: 0,
                hihat: 0,
                kick: 0,
                vocal: 0,
                melody: 0,
                hue: 0,
                saturation: 0,
                brightness: 0
              });
            }
            try {
              volcanicCoreRef.current.render();
            } catch (error) {
              console.error('VolcanicCoreRenderer render error:', error);
            }
          }
          break;
        case 'crystal':
          if (crystalLoomRef.current) {
            const analysisFrame = audioEngine.audioEngineRef?.current?.getAnalysisFrame?.() as AnalysisFrame;
            if (analysisFrame) {
              const events: AudioEvent[] = [];
              for (const onset of analysisFrame.onsets) {
                events.push({
                  t: analysisFrame.time,
                  band: onset.band,
                  energy: onset.energy,
                  pitch: analysisFrame.pitch,
                  centroid: analysisFrame.centroid
                });
              }
              for (const event of events) {
                eventQueueRef.current.push(event);
              }
              const currentTime = analysisFrame.time;
              const frameEvents = eventQueueRef.current.popSince(currentTime - 0.016, currentTime);
              crystalLoomRef.current.update(0.016, frameEvents, analysisFrame);
            } else {
              crystalLoomRef.current.update(0.016, [], {
                time: Date.now() / 1000,
                rms: 0,
                low: 0,
                mid: 0,
                high: 0,
                centroid: 0,
                onsets: [],
                beatPhase: 0,
                bassDrum: 0,
                snare: 0,
                hihat: 0,
                kick: 0,
                vocal: 0,
                melody: 0,
                hue: 0,
                saturation: 0,
                brightness: 0
              });
            }
            try {
              crystalLoomRef.current.render();
            } catch (error) {
              console.error('CrystalLoomRenderer render error:', error);
            }
          }
          break;
        case 'paintflow':
          if (paintFlowRef.current) {
            const analysisFrame = audioEngine.audioEngineRef?.current?.getAnalysisFrame?.() as AnalysisFrame;
            if (analysisFrame) {
              const events: AudioEvent[] = [];
              for (const onset of analysisFrame.onsets) {
                events.push({
                  t: analysisFrame.time,
                  band: onset.band,
                  energy: onset.energy,
                  pitch: analysisFrame.pitch,
                  centroid: analysisFrame.centroid
                });
              }
              for (const event of events) {
                eventQueueRef.current.push(event);
              }
              const currentTime = analysisFrame.time;
              const frameEvents = eventQueueRef.current.popSince(currentTime - 0.016, currentTime);
              paintFlowRef.current.update(0.016, frameEvents, analysisFrame);
            } else {
              paintFlowRef.current.update(0.016, [], {
                time: Date.now() / 1000,
                rms: 0,
                low: 0,
                mid: 0,
                high: 0,
                centroid: 0,
                onsets: [],
                beatPhase: 0,
                bassDrum: 0,
                snare: 0,
                hihat: 0,
                kick: 0,
                vocal: 0,
                melody: 0,
                hue: 0,
                saturation: 0,
                brightness: 0
              });
            }
            try {
              paintFlowRef.current.render();
            } catch (error) {
              console.error('PaintFlowRenderer render error:', error);
            }
          }
          break;
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Always run animation for continuous visual output
    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentRenderer]); // Only depend on currentRenderer

  const handleStartStop = async () => {
    if (!audioEngine.isInitialized) {
      await audioEngine.initialize();
    }
    
    if (appState.isPlaying) {
      audioEngine.stop();
      onStateChange({ isPlaying: false });
    } else {
      try {
        await audioEngine.startMicrophone();
        onStateChange({ isPlaying: true });
      } catch (error) {
        console.error('Failed to start audio:', error);
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, file.type, file.size);
      try {
        if (!audioEngine.isInitialized) {
          console.log('Initializing audio engine...');
          await audioEngine.initialize();
          console.log('Audio engine initialized');
        }
        console.log('Loading audio file...');
        await audioEngine.loadAudioFile(file);
        onStateChange({ isPlaying: true });
        console.log('Audio file loaded successfully:', file.name);
      } catch (error) {
        console.error('Failed to load audio file:', error);
      }
    }
  };

  const handlePresetSelect = (preset: any) => {
    onStateChange({ activePreset: preset });
    LivePresets.applyPresetToModMatrix(modMatrixRef.current, preset);
  };

  return (
    <div className="studio-view">
      {/* Canvas Container */}
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          className="main-canvas"
          style={{
            width: '100%',
            height: '100%',
            background: 'black'
          }}
        />
      </div>
      
      {/* Audio Controls Overlay */}
      <div className="audio-controls">
          <button
            onClick={handleStartStop}
            className={`play-button ${appState.isPlaying ? 'playing' : 'stopped'}`}
          >
            {appState.isPlaying ? '⏸' : '▶️'}
          </button>
          
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="file-input"
          />
          
          <div className="volume-control">
            <label>Volume</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              defaultValue="0.5"
              onChange={(e) => {
                const volume = parseFloat(e.target.value);
                console.log('Volume changed to:', volume);
                
                // Update both file and microphone volume
                if (audioEngine.audioEngineRef?.current) {
                  const audioEngineInstance = audioEngine.audioEngineRef.current as any;
                  
                  // Update file audio volume
                  if (audioEngineInstance.gainNode) {
                    audioEngineInstance.gainNode.gain.value = volume;
                    console.log('File audio volume set to:', volume);
                  }
                  
                  // Update microphone volume
                  if (audioEngineInstance.micGainNode) {
                    audioEngineInstance.micGainNode.gain.value = volume * 0.5; // Lower volume for mic
                    console.log('Microphone volume set to:', volume * 0.5);
                  }
                  
                  if (!audioEngineInstance.gainNode && !audioEngineInstance.micGainNode) {
                    console.warn('No gain nodes found for volume control');
                  }
                }
              }}
            />
          </div>
          
          {audioEngine.error && (
            <div className="error-message">
              {audioEngine.error}
            </div>
          )}
        </div>
      
      {/* Visual Style Selector */}
      <div className="control-panel">
        <div className="mode-selector">
          <h3>🎨 Visual Styles</h3>
          <div className="preset-grid">
            <button 
              className={`preset-button ${currentRenderer === 'jellyfish' ? 'active' : ''}`}
              onClick={() => setCurrentRenderer('jellyfish')}
            >
              <div className="preset-icon">🪼</div>
              <div className="preset-name">Jellyfish Pulses</div>
              <div className="preset-description">深海生物発光スタイル - 有機的で流動的な表現</div>
            </button>
            
            <button 
              className={`preset-button ${currentRenderer === 'neural' ? 'active' : ''}`}
              onClick={() => setCurrentRenderer('neural')}
            >
              <div className="preset-icon">🧠</div>
              <div className="preset-name">Neural Circuit</div>
              <div className="preset-description">神経回路スタイル - 構造的で電気的な表現</div>
            </button>
            
            <button 
              className={`preset-button ${currentRenderer === 'volcanic' ? 'active' : ''}`}
              onClick={() => setCurrentRenderer('volcanic')}
            >
              <div className="preset-icon">🌋</div>
              <div className="preset-name">Volcanic Core</div>
              <div className="preset-description">溶岩コアスタイル - 熱的で渦巻く表現</div>
            </button>
            
            <button 
              className={`preset-button ${currentRenderer === 'crystal' ? 'active' : ''}`}
              onClick={() => setCurrentRenderer('crystal')}
            >
              <div className="preset-icon">🔷</div>
              <div className="preset-name">Crystal Loom</div>
              <div className="preset-description">幾何学グリッドスタイル - 数学的で構造的な表現</div>
            </button>
            
            <button 
              className={`preset-button ${currentRenderer === 'paintflow' ? 'active' : ''}`}
              onClick={() => setCurrentRenderer('paintflow')}
            >
              <div className="preset-icon">🎨</div>
              <div className="preset-name">Paint Flow</div>
              <div className="preset-description">ラメ入り絵の具スタイル - 上下から交わる流動的な表現</div>
            </button>
          </div>
        </div>
        
        {/* PresetSelector temporarily hidden to focus on Visual Styles */}
        {/* <PresetSelector
          presets={LivePresets.getAllPresets()}
          activePreset={appState.activePreset}
          onPresetSelect={handlePresetSelect}
        /> */}
      </div>
      
      {/* Code Overlay */}
      <CodeOverlay 
        appState={appState} 
        audioAnalysis={audioEngine.analysis} 
      />
      
    </div>
  );
};
