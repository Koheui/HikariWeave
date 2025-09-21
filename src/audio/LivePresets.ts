export class LivePresets {
  static getBeamPreset(): any {
    return {
      id: 'beam',
      name: 'BEAM',
      type: 'beam',
      parameters: {
        waveform: 0, // Sine wave
        vertices: 3, // Triangle
        scale: 1.0,
        rotation: 0.0,
        hue: 0.0,
        saturation: 1.0,
        value: 1.0,
        bloom: 0.3,
        strobe: 0.0
      },
      connections: [
        // Low frequency affects scale and bloom
        { sourceId: 'low', transformId: 'env1', targetId: 'scale', amount: 0.8 },
        { sourceId: 'low', transformId: 'env1', targetId: 'bloom', amount: 0.6 },
        
        // High frequency affects strobe
        { sourceId: 'high', transformId: 'env2', targetId: 'strobe', amount: 0.4 },
        
        // Spectral centroid affects hue
        { sourceId: 'centroid', transformId: 'curve1', targetId: 'hue', amount: 0.3 },
        
        // RMS affects overall brightness
        { sourceId: 'rms', transformId: 'env1', targetId: 'value', amount: 0.7 },
        
        // Onset triggers rotation
        { sourceId: 'onset', transformId: 'env2', targetId: 'rotation', amount: 0.5 }
      ]
    };
  }

  static getWavePreset(): any {
    return {
      id: 'wave',
      name: 'WAVE',
      type: 'wave',
      parameters: {
        waveform: 0.2, // Saw wave
        vertices: 4, // Square
        scale: 1.0,
        rotation: 0.0,
        hue: 0.33, // Green
        saturation: 1.0,
        value: 1.0,
        bloom: 0.2,
        domainWarp: 0.0,
        noise: 0.0
      },
      connections: [
        // Low frequency affects amplitude (scale)
        { sourceId: 'low', transformId: 'env1', targetId: 'scale', amount: 1.0 },
        
        // Mid frequency affects domain warp
        { sourceId: 'mid', transformId: 'env1', targetId: 'domainWarp', amount: 0.6 },
        
        // High frequency affects moire (noise)
        { sourceId: 'high', transformId: 'env2', targetId: 'noise', amount: 0.4 },
        
        // Spectral centroid affects hue
        { sourceId: 'centroid', transformId: 'curve1', targetId: 'hue', amount: 0.4 },
        
        // Peak affects bloom
        { sourceId: 'peak', transformId: 'env1', targetId: 'bloom', amount: 0.5 },
        
        // BPM affects rotation speed
        { sourceId: 'bpm', transformId: 'curve1', targetId: 'rotation', amount: 0.3 }
      ]
    };
  }

  static getParticlesPreset(): any {
    return {
      id: 'particles',
      name: 'PARTICLES',
      type: 'particles',
      parameters: {
        waveform: 0.8, // Pulse wave
        vertices: 5, // Pentagon
        scale: 1.0,
        rotation: 0.0,
        hue: 0.67, // Purple
        saturation: 1.0,
        value: 1.0,
        bloom: 0.4,
        noise: 0.0,
        shake: 0.0
      },
      connections: [
        // Low frequency affects particle density (scale)
        { sourceId: 'low', transformId: 'env1', targetId: 'scale', amount: 0.9 },
        
        // Mid frequency affects brush pressure (noise)
        { sourceId: 'mid', transformId: 'env1', targetId: 'noise', amount: 0.7 },
        
        // High frequency affects sparkle (shake)
        { sourceId: 'high', transformId: 'env2', targetId: 'shake', amount: 0.6 },
        
        // Spectral centroid affects hue
        { sourceId: 'centroid', transformId: 'curve1', targetId: 'hue', amount: 0.5 },
        
        // RMS affects bloom
        { sourceId: 'rms', transformId: 'env1', targetId: 'bloom', amount: 0.8 },
        
        // Onset triggers rotation bursts
        { sourceId: 'onset', transformId: 'env2', targetId: 'rotation', amount: 0.7 }
      ]
    };
  }

  static getAllPresets(): any[] {
    return [
      this.getBeamPreset(),
      this.getWavePreset(),
      this.getParticlesPreset()
    ];
  }

  static getPresetById(id: string): any | null {
    const presets = this.getAllPresets();
    return presets.find(preset => preset.id === id) || null;
  }

  static applyPresetToModMatrix(modMatrix: any, preset: any): void {
    // Clear existing connections
    modMatrix.clearConnections();
    
    // Add preset connections
    preset.connections.forEach(connection => {
      modMatrix.addConnection(connection);
    });
  }

  static updatePresetParameters(preset: any, parameters: Record<string, number>): any {
    return {
      ...preset,
      parameters: {
        ...preset.parameters,
        ...parameters
      }
    };
  }
}
