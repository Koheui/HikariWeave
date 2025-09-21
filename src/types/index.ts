// Audio Analysis Types
export interface AudioAnalysis {
  fft: Float32Array;
  rms: number;
  peak: number;
  low: number;
  mid: number;
  high: number;
  onset: boolean;
  bpm: number;
  spectralCentroid: number;
  pitch: number;
  chroma: number[];
}

// Mod Matrix Types
export interface ModSource {
  id: string;
  name: string;
  value: number;
  type: 'audio' | 'manual' | 'lfo';
}

export interface ModTransform {
  id: string;
  name: string;
  attack: number;
  decay: number;
  hold: number;
  curve: 'linear' | 'exponential' | 'logarithmic' | 'quantized';
  range: { min: number; max: number };
  polarity: 'unipolar' | 'bipolar';
  gate: boolean;
  trigger: boolean;
  jitter: number;
}

export interface ModTarget {
  id: string;
  name: string;
  category: 'motion' | 'shape' | 'color' | 'fx' | 'material' | 'mask';
  value: number;
}

export interface ModConnection {
  sourceId: string;
  transformId: string;
  targetId: string;
  amount: number;
}

// Visual Preset Types
export type PresetType = 'beam' | 'wave' | 'particles' | 'biocircuit' | 'crystal' | 'aeromorph';

export interface VisualPreset {
  id: string;
  name: string;
  type: PresetType;
  parameters: Record<string, number>;
  connections: ModConnection[];
}

// Background Types
export type BackgroundType = 'black' | 'solid' | 'gradient' | 'pattern';

export interface BackgroundConfig {
  type: BackgroundType;
  colorA?: { h: number; s: number; v: number };
  colorB?: { h: number; s: number; v: number };
  pattern?: string;
}

// Color Palette Types
export type ColorPalette = 'neon' | 'warm' | 'corporate' | 'mono';

export interface ColorConfig {
  palette: ColorPalette;
  hue: number;
  saturation: number;
  value: number;
  bloom: number;
  temperature: number;
}

// App Modes
export type AppMode = 'live' | 'sculpt' | 'mv' | 'mapping';

export interface AppState {
  mode: AppMode;
  isPlaying: boolean;
  isFullscreen: boolean;
  codeOverlay: 'off' | 'minimal' | 'full';
  background: BackgroundConfig;
  color: ColorConfig;
  activePreset: VisualPreset | null;
  macroKnobs: {
    energy: number;
    density: number;
    purity: number;
    glow: number;
  };
  scenes: VisualPreset[];
  activeScene: number;
}

// Firebase Types
export interface Room {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomParams {
  waveform: 'sine' | 'saw' | 'triangle' | 'square' | 'pulse' | 'noise';
  freq: number;
  speed: number;
  pwm: number;
  brightness: number;
  contrast: number;
  gradientA: { h: number; s: number; v: number };
  gradientB: { h: number; s: number; v: number };
  background: BackgroundConfig;
  matrix: ModConnection[];
  presetId?: string;
}

export interface Preset {
  id: string;
  name: string;
  author: string;
  isPublic: boolean;
  params: Record<string, any>;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Member {
  uid: string;
  displayName: string;
  color: string;
  lastActive: Date;
}
