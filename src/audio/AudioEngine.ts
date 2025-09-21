export interface AnalysisFrame {
  time: number;
  rms: number;
  low: number;
  mid: number;
  high: number;
  centroid: number; // スペクトル重心 [0..1]
  pitch?: number; // MIDIノート or null
  chroma?: number[]; // 12次元正規化 or undefined
  onsets: { band: 'low'|'mid'|'high'|'full'; energy: number }[];
  bpm?: number;
  beatPhase: number; // 拍位相 [0..1]
  
  // 音楽要素の詳細分析
  bassDrum: number; // バスドラム強度 (60-80Hz)
  snare: number; // スネア強度 (200-300Hz)
  hihat: number; // ハイハット強度 (8000-12000Hz)
  kick: number; // キック強度 (40-100Hz)
  vocal: number; // ボーカル範囲 (300-3400Hz)
  melody: number; // メロディー強度 (200-2000Hz)
  
  // 色制御用パラメータ
  hue: number; // 色相 [0..1]
  saturation: number; // 彩度 [0..1]
  brightness: number; // 明度 [0..1]
}

export interface AudioEvent {
  t: number; // 発生時刻
  band: 'low'|'mid'|'high'|'full';
  energy: number; // 0..1
  pitch?: number;
  centroid?: number;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private audioSource: MediaElementAudioSourceNode | null = null;
  private isInitialized = false;
  private fftSize = 2048;
  private bufferLength: number;
  private dataArray: Uint8Array;
  private frequencyData: Float32Array;
  private timeData: Float32Array;
  
  // Analysis parameters
  private lowPassFreq = 250;
  private midPassFreq = 2000;
  private highPassFreq = 4000;
  
  // Onset detection
  private previousSpectrum: Float32Array;
  private onsetThreshold = 0.3;
  private onsetDecay = 0.95;
  private onsetCounter = 0;
  
  // BPM detection
  private bpmHistory: number[] = [];
  private lastBeatTime = 0;
  private beatInterval = 0;
  private beatPhase = 0;
  
  // Enhanced analysis
  private previousFrame: AnalysisFrame | null = null;
  private onsetThresholds = { low: 0.3, mid: 0.25, high: 0.2, full: 0.15 };
  private spectralFluxHistory: number[] = [];
  private fluxHistoryLength = 10;

  constructor() {
    this.bufferLength = this.fftSize / 2;
    this.dataArray = new Uint8Array(this.bufferLength);
    this.frequencyData = new Float32Array(this.bufferLength);
    this.timeData = new Float32Array(this.fftSize);
    this.previousSpectrum = new Float32Array(this.bufferLength);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = 0.8;
      
      // Ensure audio context is running
      if (this.audioContext.state === 'suspended') {
        console.log('Starting audio context...');
        await this.audioContext.resume();
      }
      
      this.isInitialized = true;
      console.log('Audio engine initialized, state:', this.audioContext.state);
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      throw error;
    }
  }

  async startMicrophone(): Promise<void> {
    if (!this.audioContext || !this.analyser) {
      throw new Error('Audio engine not initialized');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      this.microphone = this.audioContext.createMediaStreamSource(stream);
      
      // Connect to both analyser and speakers
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0.5; // Higher volume for microphone
      
      // Connect microphone to gain node, then to both analyser and speakers
      this.microphone.connect(gainNode);
      gainNode.connect(this.analyser);
      gainNode.connect(this.audioContext.destination);
      
      // Store reference
      (this as any).micGainNode = gainNode;
    } catch (error) {
      console.error('Failed to start microphone:', error);
      throw error;
    }
  }

  async loadAudioFile(file: File): Promise<void> {
    if (!this.audioContext || !this.analyser) {
      throw new Error('Audio engine not initialized');
    }

    console.log('Starting audio file load:', file.name);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('File read successfully, decoding audio data...');
        const audioData = e.target?.result as ArrayBuffer;
        this.audioContext!.decodeAudioData(audioData)
          .then((audioBuffer) => {
            console.log('Audio data decoded successfully');
            
            // Create a buffer source for playback
            const source = this.audioContext!.createBufferSource();
            source.buffer = audioBuffer;
            
            // Connect to both analyser and speakers
            const gainNode = this.audioContext!.createGain();
            gainNode.gain.value = 0.8; // Higher volume for better audibility
            
            // Connect source to gain node
            source.connect(gainNode);
            
            // Connect to both analyser and speakers directly
            gainNode.connect(this.analyser!);
            gainNode.connect(this.audioContext!.destination);
            
            source.loop = true;
            
            // Store reference to prevent garbage collection
            (this as any).audioSource = source;
            (this as any).gainNode = gainNode;
            
            console.log('Audio source created, starting playback...');
            
            // Ensure audio context is running
            if (this.audioContext!.state === 'suspended') {
              console.log('Resuming audio context for playback...');
              this.audioContext!.resume().then(() => {
                console.log('Audio context resumed successfully');
              });
            }
            
            source.start();
            console.log('Audio playback started successfully');
            resolve();
          })
          .catch(reject);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  stop(): void {
    console.log('Stopping audio...');
    
    // Stop audio source if it exists
    const audioSource = (this as any).audioSource;
    if (audioSource) {
      try {
        audioSource.stop();
        console.log('Audio source stopped');
      } catch (error) {
        console.log('Audio source already stopped or error:', error);
      }
      (this as any).audioSource = null;
    }
    
    // Stop microphone if it exists
    if (this.microphone) {
      try {
        this.microphone.disconnect();
        console.log('Microphone disconnected');
      } catch (error) {
        console.log('Microphone disconnect error:', error);
      }
      this.microphone = null;
    }
    
    console.log('Audio stopped successfully');
  }

  getAnalysis(): any {
    if (!this.analyser) {
      throw new Error('Audio engine not initialized');
    }

    // Get frequency data
    this.analyser.getFloatFrequencyData(this.frequencyData);
    this.analyser.getFloatTimeDomainData(this.timeData);

    // Calculate RMS
    let rms = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      rms += this.timeData[i] * this.timeData[i];
    }
    rms = Math.sqrt(rms / this.timeData.length);

    // Calculate peak
    const peak = Math.max(...Array.from(this.timeData).map(Math.abs));

    // Calculate frequency bands
    const low = this.calculateBandEnergy(0, this.lowPassFreq);
    const mid = this.calculateBandEnergy(this.lowPassFreq, this.midPassFreq);
    const high = this.calculateBandEnergy(this.midPassFreq, this.highPassFreq);

    // Detect onset
    const onset = this.detectOnset();

    // Calculate BPM
    const bpm = this.calculateBPM();

    // Calculate spectral centroid
    const spectralCentroid = this.calculateSpectralCentroid();

    // Calculate pitch and chroma (simplified)
    const pitch = this.calculatePitch();
    const chroma = this.calculateChroma();

    return {
      fft: this.frequencyData,
      rms,
      peak,
      low,
      mid,
      high,
      onset,
      bpm,
      spectralCentroid,
      pitch,
      chroma
    };
  }

  // New enhanced analysis method
  getAnalysisFrame(): AnalysisFrame {
    if (!this.analyser) {
      throw new Error('Audio engine not initialized');
    }

    const currentTime = this.audioContext!.currentTime;
    
    // Get frequency data
    this.analyser.getFloatFrequencyData(this.frequencyData);
    this.analyser.getFloatTimeDomainData(this.timeData);

    // Calculate RMS
    let rms = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      rms += this.timeData[i] * this.timeData[i];
    }
    rms = Math.sqrt(rms / this.timeData.length);

    // Calculate frequency bands
    const low = this.calculateBandEnergy(0, this.lowPassFreq);
    const mid = this.calculateBandEnergy(this.lowPassFreq, this.midPassFreq);
    const high = this.calculateBandEnergy(this.midPassFreq, this.highPassFreq);

    // Calculate specific musical elements
    const bassDrum = this.calculateBandEnergy(60, 80); // バスドラム
    const snare = this.calculateBandEnergy(200, 300); // スネア
    const hihat = this.calculateBandEnergy(8000, 12000); // ハイハット
    const kick = this.calculateBandEnergy(40, 100); // キック
    const vocal = this.calculateBandEnergy(300, 3400); // ボーカル
    const melody = this.calculateBandEnergy(200, 2000); // メロディー

    // Calculate spectral centroid
    const centroid = this.calculateSpectralCentroid();

    // Detect onsets for each band
    const onsets = this.detectBandOnsets();

    // Calculate BPM and beat phase
    const bpm = this.calculateBPM();
    this.updateBeatPhase(bpm);

    // Detect pitch and chroma
    const pitch = this.calculatePitch();
    const chroma = this.calculateChroma();

    // Calculate color parameters based on musical elements
    const hue = this.calculateHue(bassDrum, snare, hihat, melody);
    const saturation = this.calculateSaturation(rms, centroid);
    const brightness = this.calculateBrightness(rms, bassDrum, hihat);

    const frame: AnalysisFrame = {
      time: currentTime,
      rms,
      low,
      mid,
      high,
      centroid,
      pitch,
      chroma,
      onsets,
      bpm,
      beatPhase: this.beatPhase,
      
      // Musical elements
      bassDrum,
      snare,
      hihat,
      kick,
      vocal,
      melody,
      
      // Color control
      hue,
      saturation,
      brightness
    };

    this.previousFrame = frame;
    return frame;
  }

  private calculateBandEnergy(lowFreq: number, highFreq: number): number {
    const nyquist = this.audioContext!.sampleRate / 2;
    const lowBin = Math.floor((lowFreq / nyquist) * this.bufferLength);
    const highBin = Math.floor((highFreq / nyquist) * this.bufferLength);
    
    let energy = 0;
    for (let i = lowBin; i < highBin && i < this.bufferLength; i++) {
      energy += Math.pow(10, this.frequencyData[i] / 10);
    }
    return energy;
  }

  private detectOnset(): boolean {
    let flux = 0;
    for (let i = 0; i < this.bufferLength; i++) {
      const diff = this.frequencyData[i] - this.previousSpectrum[i];
      if (diff > 0) {
        flux += diff;
      }
    }

    const detected = flux > this.onsetThreshold;
    
    if (detected) {
      this.onsetCounter = 10; // Hold for 10 frames
    } else {
      this.onsetCounter = Math.max(0, this.onsetCounter - 1);
    }

    // Update previous spectrum
    this.previousSpectrum.set(this.frequencyData);

    return this.onsetCounter > 0;
  }

  private detectBandOnsets(): { band: 'low'|'mid'|'high'|'full'; energy: number }[] {
    const onsets: { band: 'low'|'mid'|'high'|'full'; energy: number }[] = [];
    
    if (!this.previousFrame) {
      return onsets;
    }

    // Calculate spectral flux for each band
    const lowFlux = this.calculateSpectralFlux('low');
    const midFlux = this.calculateSpectralFlux('mid');
    const highFlux = this.calculateSpectralFlux('high');
    const fullFlux = this.calculateSpectralFlux('full');

    // Check for onsets in each band
    if (lowFlux > this.onsetThresholds.low) {
      onsets.push({ band: 'low', energy: lowFlux });
    }
    if (midFlux > this.onsetThresholds.mid) {
      onsets.push({ band: 'mid', energy: midFlux });
    }
    if (highFlux > this.onsetThresholds.high) {
      onsets.push({ band: 'high', energy: highFlux });
    }
    if (fullFlux > this.onsetThresholds.full) {
      onsets.push({ band: 'full', energy: fullFlux });
    }

    return onsets;
  }

  private calculateSpectralFlux(band: 'low'|'mid'|'high'|'full'): number {
    if (!this.previousFrame) return 0;

    let flux = 0;
    const currentSpectrum = this.frequencyData;
    const previousSpectrum = this.previousFrame ? this.frequencyData : new Float32Array(this.bufferLength);

    let startBin = 0, endBin = this.bufferLength;
    
    switch (band) {
      case 'low':
        endBin = Math.floor((this.lowPassFreq / (this.audioContext!.sampleRate / 2)) * this.bufferLength);
        break;
      case 'mid':
        startBin = Math.floor((this.lowPassFreq / (this.audioContext!.sampleRate / 2)) * this.bufferLength);
        endBin = Math.floor((this.midPassFreq / (this.audioContext!.sampleRate / 2)) * this.bufferLength);
        break;
      case 'high':
        startBin = Math.floor((this.midPassFreq / (this.audioContext!.sampleRate / 2)) * this.bufferLength);
        break;
    }

    for (let i = startBin; i < endBin; i++) {
      const diff = currentSpectrum[i] - previousSpectrum[i];
      if (diff > 0) {
        flux += diff;
      }
    }

    return flux / (endBin - startBin);
  }

  private updateBeatPhase(bpm: number): void {
    if (!bpm || bpm < 60) return;

    const currentTime = this.audioContext!.currentTime;
    const beatInterval = 60 / bpm; // seconds per beat
    
    if (this.lastBeatTime === 0) {
      this.lastBeatTime = currentTime;
      this.beatPhase = 0;
    } else {
      const timeSinceLastBeat = currentTime - this.lastBeatTime;
      this.beatPhase = (timeSinceLastBeat % beatInterval) / beatInterval;
      
      // Detect beat
      if (timeSinceLastBeat >= beatInterval) {
        this.lastBeatTime = currentTime;
        this.beatPhase = 0;
      }
    }
  }

  private calculateBPM(): number {
    if (this.onsetCounter > 0) {
      const now = Date.now();
      if (this.lastBeatTime > 0) {
        const interval = now - this.lastBeatTime;
        if (interval > 200 && interval < 2000) { // Reasonable BPM range
          this.bpmHistory.push(60000 / interval);
          if (this.bpmHistory.length > 10) {
            this.bpmHistory.shift();
          }
        }
      }
      this.lastBeatTime = now;
    }

    if (this.bpmHistory.length > 0) {
      return this.bpmHistory.reduce((a, b) => a + b) / this.bpmHistory.length;
    }
    return 120; // Default BPM
  }

  private calculateSpectralCentroid(): number {
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < this.bufferLength; i++) {
      const magnitude = Math.pow(10, this.frequencyData[i] / 10);
      weightedSum += i * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  private calculatePitch(): number {
    // Simplified pitch detection using autocorrelation
    const minPeriod = 10;
    const maxPeriod = 200;
    let bestPeriod = 0;
    let bestCorrelation = 0;

    for (let period = minPeriod; period < maxPeriod; period++) {
      let correlation = 0;
      for (let i = 0; i < this.timeData.length - period; i++) {
        correlation += this.timeData[i] * this.timeData[i + period];
      }
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }

    return bestPeriod > 0 ? this.audioContext!.sampleRate / bestPeriod : 0;
  }

  private calculateChroma(): number[] {
    const chroma = new Array(12).fill(0);
    const nyquist = this.audioContext!.sampleRate / 2;
    
    for (let i = 0; i < this.bufferLength; i++) {
      const freq = (i / this.bufferLength) * nyquist;
      const magnitude = Math.pow(10, this.frequencyData[i] / 10);
      
      if (freq > 80 && freq < 5000) { // Musical range
        const chromaIndex = Math.round(12 * Math.log2(freq / 440)) % 12;
        if (chromaIndex >= 0 && chromaIndex < 12) {
          chroma[chromaIndex] += magnitude;
        }
      }
    }
    
    return chroma;
  }

  // Color control methods
  private calculateHue(bassDrum: number, snare: number, hihat: number, melody: number): number {
    // バスドラム = 赤 (0.0), スネア = 緑 (0.33), ハイハット = 青 (0.67), メロディー = 紫 (0.8)
    let hue = 0.0;
    
    if (bassDrum > 0.1) {
      hue = 0.0; // 赤
    } else if (snare > 0.1) {
      hue = 0.33; // 緑
    } else if (hihat > 0.1) {
      hue = 0.67; // 青
    } else if (melody > 0.1) {
      hue = 0.8; // 紫
    } else {
      // 複数の要素が同時に存在する場合、重み付け平均
      const total = bassDrum + snare + hihat + melody;
      if (total > 0) {
        hue = (bassDrum * 0.0 + snare * 0.33 + hihat * 0.67 + melody * 0.8) / total;
      }
    }
    
    return hue;
  }

  private calculateSaturation(rms: number, centroid: number): number {
    // RMSが高いほど彩度が高い、スペクトル重心が高いほど彩度が高い
    const rmsSaturation = Math.min(1.0, rms * 3.0);
    const centroidSaturation = Math.min(1.0, centroid * 1.5);
    return Math.max(0.3, (rmsSaturation + centroidSaturation) / 2);
  }

  private calculateBrightness(rms: number, bassDrum: number, hihat: number): number {
    // バスドラムは暗く、ハイハットは明るく
    const baseBrightness = Math.min(1.0, rms * 2.0);
    const bassDarkness = bassDrum * 0.3; // バスドラムで暗く
    const hihatBrightness = hihat * 0.4; // ハイハットで明るく
    
    return Math.max(0.1, Math.min(1.0, baseBrightness - bassDarkness + hihatBrightness));
  }

  setFFTSize(size: number): void {
    this.fftSize = size;
    this.bufferLength = size / 2;
    this.dataArray = new Uint8Array(this.bufferLength);
    this.frequencyData = new Float32Array(this.bufferLength);
    this.timeData = new Float32Array(this.fftSize);
    this.previousSpectrum = new Float32Array(this.bufferLength);
    
    if (this.analyser) {
      this.analyser.fftSize = size;
    }
  }

  dispose(): void {
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    
    if (this.audioSource) {
      this.audioSource.disconnect();
      this.audioSource = null;
    }
    
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isInitialized = false;
  }
}

// Explicit exports
export type { AnalysisFrame, AudioEvent };
