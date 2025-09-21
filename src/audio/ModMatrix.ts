export class ModMatrix {
  private sources: any[] = [];
  private transforms: any[] = [];
  private targets: any[] = [];
  private connections: any[] = [];

  constructor() {
    this.initializeDefaultSources();
    this.initializeDefaultTransforms();
    this.initializeDefaultTargets();
  }

  private initializeDefaultSources(): void {
    this.sources = [
      { id: 'low', name: 'Low', value: 0, type: 'audio' },
      { id: 'mid', name: 'Mid', value: 0, type: 'audio' },
      { id: 'high', name: 'High', value: 0, type: 'audio' },
      { id: 'rms', name: 'RMS', value: 0, type: 'audio' },
      { id: 'peak', name: 'Peak', value: 0, type: 'audio' },
      { id: 'onset', name: 'Onset', value: 0, type: 'audio' },
      { id: 'bpm', name: 'BPM', value: 0, type: 'audio' },
      { id: 'centroid', name: 'Centroid', value: 0, type: 'audio' },
      { id: 'pitch', name: 'Pitch', value: 0, type: 'audio' },
      { id: 'manual1', name: 'Manual 1', value: 0, type: 'manual' },
      { id: 'manual2', name: 'Manual 2', value: 0, type: 'manual' },
      { id: 'lfo1', name: 'LFO 1', value: 0, type: 'lfo' },
      { id: 'lfo2', name: 'LFO 2', value: 0, type: 'lfo' }
    ];
  }

  private initializeDefaultTransforms(): void {
    this.transforms = [
      {
        id: 'env1',
        name: 'Envelope 1',
        attack: 0.1,
        decay: 0.3,
        hold: 0.1,
        curve: 'exponential',
        range: { min: 0, max: 1 },
        polarity: 'unipolar',
        gate: false,
        trigger: false,
        jitter: 0
      },
      {
        id: 'env2',
        name: 'Envelope 2',
        attack: 0.05,
        decay: 0.5,
        hold: 0.2,
        curve: 'linear',
        range: { min: -1, max: 1 },
        polarity: 'bipolar',
        gate: true,
        trigger: true,
        jitter: 0.1
      },
      {
        id: 'curve1',
        name: 'Curve 1',
        attack: 0,
        decay: 0,
        hold: 0,
        curve: 'quantized',
        range: { min: 0, max: 1 },
        polarity: 'unipolar',
        gate: false,
        trigger: false,
        jitter: 0
      }
    ];
  }

  private initializeDefaultTargets(): void {
    this.targets = [
      // Motion targets
      { id: 'posX', name: 'Position X', category: 'motion', value: 0 },
      { id: 'posY', name: 'Position Y', category: 'motion', value: 0 },
      { id: 'rotation', name: 'Rotation', category: 'motion', value: 0 },
      { id: 'scale', name: 'Scale', category: 'motion', value: 1 },
      { id: 'tile', name: 'Tile', category: 'motion', value: 1 },
      { id: 'shake', name: 'Shake', category: 'motion', value: 0 },
      
      // Shape targets
      { id: 'waveform', name: 'Waveform', category: 'shape', value: 0 },
      { id: 'vertices', name: 'Vertices', category: 'shape', value: 3 },
      { id: 'pwm', name: 'PWM', category: 'shape', value: 0.5 },
      { id: 'noise', name: 'Noise', category: 'shape', value: 0 },
      { id: 'domainWarp', name: 'Domain Warp', category: 'shape', value: 0 },
      
      // Color targets
      { id: 'hue', name: 'Hue', category: 'color', value: 0 },
      { id: 'saturation', name: 'Saturation', category: 'color', value: 1 },
      { id: 'value', name: 'Value', category: 'color', value: 1 },
      { id: 'gradientPos', name: 'Gradient Position', category: 'color', value: 0 },
      { id: 'bloom', name: 'Bloom', category: 'color', value: 0 },
      { id: 'temperature', name: 'Temperature', category: 'color', value: 0 },
      
      // FX targets
      { id: 'strobe', name: 'Strobe', category: 'fx', value: 0 },
      { id: 'blur', name: 'Blur', category: 'fx', value: 0 },
      { id: 'edge', name: 'Edge', category: 'fx', value: 0 },
      { id: 'glitch', name: 'Glitch', category: 'fx', value: 0 },
      { id: 'chromaticAberration', name: 'Chromatic Aberration', category: 'fx', value: 0 },
      
      // Material targets
      { id: 'fresnel', name: 'Fresnel', category: 'material', value: 0 },
      { id: 'roughness', name: 'Roughness', category: 'material', value: 0.5 },
      { id: 'metallic', name: 'Metallic', category: 'material', value: 0 },
      
      // Mask targets
      { id: 'maskOpen', name: 'Mask Open', category: 'mask', value: 1 },
      { id: 'maskFeather', name: 'Mask Feather', category: 'mask', value: 0 },
      { id: 'maskRotation', name: 'Mask Rotation', category: 'mask', value: 0 }
    ];
  }

  updateAudioSources(analysis: any): void {
    const sourceMap: Record<string, number> = {
      low: analysis.low,
      mid: analysis.mid,
      high: analysis.high,
      rms: analysis.rms,
      peak: analysis.peak,
      onset: analysis.onset ? 1 : 0,
      bpm: analysis.bpm / 200, // Normalize to 0-1
      centroid: analysis.spectralCentroid / this.sources.length,
      pitch: analysis.pitch / 2000 // Normalize to 0-1
    };

    this.sources.forEach(source => {
      if (source.type === 'audio' && sourceMap[source.id] !== undefined) {
        source.value = sourceMap[source.id];
      }
    });
  }

  updateLFOs(time: number): void {
    this.sources.forEach(source => {
      if (source.type === 'lfo') {
        const frequency = source.id === 'lfo1' ? 0.5 : 1.0; // Different frequencies
        source.value = Math.sin(time * frequency * Math.PI * 2) * 0.5 + 0.5;
      }
    });
  }

  processConnections(): void {
    this.connections.forEach(connection => {
      const source = this.sources.find(s => s.id === connection.sourceId);
      const transform = this.transforms.find(t => t.id === connection.transformId);
      const target = this.targets.find(t => t.id === connection.targetId);

      if (!source || !transform || !target) {
        console.warn(`Connection missing: source=${connection.sourceId}, transform=${connection.transformId}, target=${connection.targetId}`);
        return;
      }

      let value = source.value;

      // Apply transform
      value = this.applyTransform(value, transform);

      // Apply connection amount
      value *= connection.amount;

      // Update target value
      target.value = value;
    });
  }

  private applyTransform(value: number, transform: ModTransform): number {
    // Apply envelope if it's a trigger source
    if (transform.trigger && transform.gate) {
      // Simplified envelope implementation
      // In a real implementation, you'd track envelope state per source
      value = this.applyEnvelope(value, transform);
    }

    // Apply curve
    switch (transform.curve) {
      case 'linear':
        break; // No change
      case 'exponential':
        value = Math.pow(value, 2);
        break;
      case 'logarithmic':
        value = Math.sqrt(value);
        break;
      case 'quantized':
        value = Math.round(value * 8) / 8; // 8-step quantization
        break;
    }

    // Apply range mapping
    const range = transform.range;
    value = value * (range.max - range.min) + range.min;

    // Apply jitter
    if (transform.jitter > 0) {
      const jitterAmount = (Math.random() - 0.5) * 2 * transform.jitter;
      value += jitterAmount;
    }

    return value;
  }

  private applyEnvelope(value: number, transform: ModTransform): number {
    // Simplified envelope - in reality you'd track state per source
    if (value > 0.1) { // Trigger threshold
      return 1.0; // Attack phase
    }
    return value * transform.decay; // Decay phase
  }

  // Getters
  getSources(): any[] {
    return [...this.sources];
  }

  getTransforms(): any[] {
    return [...this.transforms];
  }

  getTargets(): any[] {
    return [...this.targets];
  }

  getConnections(): any[] {
    return [...this.connections];
  }

  getTargetsByCategory(category: string): any[] {
    return this.targets.filter(target => target.category === category);
  }

  // Setters
  clearConnections(): void {
    this.connections = [];
  }

  addConnection(connection: any): void {
    this.connections.push(connection);
  }

  removeConnection(sourceId: string, targetId: string): void {
    this.connections = this.connections.filter(
      conn => !(conn.sourceId === sourceId && conn.targetId === targetId)
    );
  }

  updateConnectionAmount(sourceId: string, targetId: string, amount: number): void {
    const connection = this.connections.find(
      conn => conn.sourceId === sourceId && conn.targetId === targetId
    );
    if (connection) {
      connection.amount = amount;
    }
  }

  updateTransform(transformId: string, updates: any): void {
    const transform = this.transforms.find(t => t.id === transformId);
    if (transform) {
      Object.assign(transform, updates);
    }
  }

  updateManualSource(sourceId: string, value: number): void {
    const source = this.sources.find(s => s.id === sourceId && s.type === 'manual');
    if (source) {
      source.value = value;
    }
  }
}
