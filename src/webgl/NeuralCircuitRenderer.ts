import * as THREE from 'three';
import type { AudioEvent, AnalysisFrame } from '../audio/AudioEngine';

export class NeuralCircuitRenderer {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  
  // Neural network structure
  private nodes: THREE.Vector3[] = [];
  private connections: { from: number; to: number; strength: number }[] = [];
  private nodeGeometry: THREE.BufferGeometry;
  private nodeMaterial: THREE.ShaderMaterial;
  private nodeSystem: THREE.Points;
  
  // Connection lines
  private lineGeometry: THREE.BufferGeometry;
  private lineMaterial: THREE.ShaderMaterial;
  private lineSystem: THREE.LineSegments;
  
  // Particle system for neural activity
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.ShaderMaterial;
  private particleSystem: THREE.Points;
  private particles: Float32Array;
  private particleCount = 1500;
  
  // Time tracking
  private time = 0;
  
  // Audio reactive parameters
  private audioIntensity = 0;
  private lowFrequency = 0;
  private midFrequency = 0;
  private highFrequency = 0;
  
  // Musical elements
  private bassDrum = 0;
  private snare = 0;
  private hihat = 0;
  private kick = 0;
  private vocal = 0;
  private melody = 0;
  
  // Color control
  private hue = 0;
  private saturation = 0;
  private brightness = 0;
  
  // Neural network parameters
  private maxNodes = 200;
  private connectionProbability = 0.1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupRenderer();
    this.setupScene();
    this.generateNeuralNetwork();
    this.setupNodes();
    this.setupConnections();
    this.setupParticles();
  }

  private setupRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    
    // High resolution rendering
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.renderer.setSize(this.canvas.width, this.canvas.height);
    this.renderer.setPixelRatio(pixelRatio);
    
    // Enhanced rendering settings
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    // Enable advanced features
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  private setupScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000); // Pure black background
    
    // Setup camera
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  private generateNeuralNetwork(): void {
    // Generate nodes in a 3D space
    for (let i = 0; i < this.maxNodes; i++) {
      const node = new THREE.Vector3(
        (Math.random() - 0.5) * 4, // x: -2 to 2
        (Math.random() - 0.5) * 4, // y: -2 to 2
        (Math.random() - 0.5) * 2  // z: -1 to 1
      );
      this.nodes.push(node);
    }

    // Generate connections based on proximity and probability
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const distance = this.nodes[i].distanceTo(this.nodes[j]);
        const connectionChance = this.connectionProbability * (1.0 - distance / 3.0);
        
        if (Math.random() < connectionChance) {
          this.connections.push({
            from: i,
            to: j,
            strength: 1.0 - distance / 3.0
          });
        }
      }
    }
  }

  private setupNodes(): void {
    const nodePositions = new Float32Array(this.nodes.length * 3);
    const nodeSizes = new Float32Array(this.nodes.length);
    
    for (let i = 0; i < this.nodes.length; i++) {
      nodePositions[i * 3] = this.nodes[i].x;
      nodePositions[i * 3 + 1] = this.nodes[i].y;
      nodePositions[i * 3 + 2] = this.nodes[i].z;
      nodeSizes[i] = Math.random() * 0.1 + 0.05; // Random node sizes
    }

    this.nodeGeometry = new THREE.BufferGeometry();
    this.nodeGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
    this.nodeGeometry.setAttribute('size', new THREE.BufferAttribute(nodeSizes, 1));

    this.nodeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(this.canvas.width, this.canvas.height) },
        u_audioIntensity: { value: 0 },
        u_lowFreq: { value: 0 },
        u_midFreq: { value: 0 },
        u_highFreq: { value: 0 },
        u_bassDrum: { value: 0 },
        u_snare: { value: 0 },
        u_hue: { value: 0 },
        u_saturation: { value: 0 },
        u_brightness: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        uniform float u_time;
        uniform float u_audioIntensity;
        uniform float u_lowFreq;
        
        varying float vAlpha;
        varying float vSize;
        
        void main() {
          vec3 pos = position;
          
          // Gentle pulsing motion
          pos.z += sin(u_time * 2.0 + pos.x * 0.5) * 0.02;
          
          // Audio reactive movement
          pos += vec3(
            sin(u_time * 1.5) * u_lowFreq * 0.1,
            cos(u_time * 1.2) * u_audioIntensity * 0.05,
            0.0
          );
          
          gl_Position = vec4(pos, 1.0);
          gl_PointSize = size * 50.0 + u_audioIntensity * 20.0;
          
          vSize = size;
          vAlpha = 0.6 + u_audioIntensity * 0.4;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying float vSize;
        
        void main() {
          float distance = length(gl_PointCoord - vec2(0.5));
          float alpha = (1.0 - smoothstep(0.0, 0.5, distance)) * vAlpha;
          
          // Bright white core with subtle glow
          vec3 color = vec3(1.0, 1.0, 1.0);
          
          // Add inner structure
          float innerRing = 1.0 - smoothstep(0.0, 0.2, distance);
          color += vec3(innerRing * 0.3);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    this.nodeSystem = new THREE.Points(this.nodeGeometry, this.nodeMaterial);
    this.scene.add(this.nodeSystem);
  }

  private setupConnections(): void {
    const linePositions = new Float32Array(this.connections.length * 6); // 2 points per line
    
    for (let i = 0; i < this.connections.length; i++) {
      const connection = this.connections[i];
      const fromNode = this.nodes[connection.from];
      const toNode = this.nodes[connection.to];
      
      // Start point
      linePositions[i * 6] = fromNode.x;
      linePositions[i * 6 + 1] = fromNode.y;
      linePositions[i * 6 + 2] = fromNode.z;
      
      // End point
      linePositions[i * 6 + 3] = toNode.x;
      linePositions[i * 6 + 4] = toNode.y;
      linePositions[i * 6 + 5] = toNode.z;
    }

    this.lineGeometry = new THREE.BufferGeometry();
    this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    this.lineMaterial = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(this.canvas.width, this.canvas.height) },
        u_audioIntensity: { value: 0 },
        u_midFreq: { value: 0 },
        u_highFreq: { value: 0 },
        u_hihat: { value: 0 },
        u_hue: { value: 0 }
      },
      vertexShader: `
        uniform float u_time;
        uniform float u_audioIntensity;
        uniform float u_midFreq;
        
        varying float vAlpha;
        varying float vDistance;
        
        void main() {
          vec3 pos = position;
          
          // Subtle movement along the line
          float lineProgress = float(gl_VertexID % 2) * 2.0 - 1.0; // -1 or 1
          pos += vec3(
            sin(u_time * 0.5 + lineProgress) * u_midFreq * 0.01,
            cos(u_time * 0.3 + lineProgress) * u_audioIntensity * 0.005,
            0.0
          );
          
          gl_Position = vec4(pos, 1.0);
          
          vDistance = lineProgress;
          vAlpha = 0.3 + u_audioIntensity * 0.7;
        }
      `,
      fragmentShader: `
        uniform float u_time;
        varying float vAlpha;
        varying float vDistance;
        
        void main() {
          // Create flowing energy effect along the line
          float energy = sin(vDistance * 10.0 + u_time * 2.0) * 0.5 + 0.5;
          
          vec3 color = vec3(0.9, 0.95, 1.0); // Cool white-blue
          color *= energy;
          
          gl_FragColor = vec4(color, vAlpha * energy);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    this.lineSystem = new THREE.LineSegments(this.lineGeometry, this.lineMaterial);
    this.scene.add(this.lineSystem);
  }

  private setupParticles(): void {
    this.particles = new Float32Array(this.particleCount * 3);
    
    // Initialize particle positions along neural connections
    for (let i = 0; i < this.particleCount; i++) {
      if (this.connections.length > 0) {
        const connection = this.connections[Math.floor(Math.random() * this.connections.length)];
        const fromNode = this.nodes[connection.from];
        const toNode = this.nodes[connection.to];
        
        // Position particle along the connection
        const t = Math.random();
        this.particles[i * 3] = fromNode.x + (toNode.x - fromNode.x) * t;
        this.particles[i * 3 + 1] = fromNode.y + (toNode.y - fromNode.y) * t;
        this.particles[i * 3 + 2] = fromNode.z + (toNode.z - fromNode.z) * t;
      } else {
        // Fallback random positions
        this.particles[i * 3] = (Math.random() - 0.5) * 4;
        this.particles[i * 3 + 1] = (Math.random() - 0.5) * 4;
        this.particles[i * 3 + 2] = (Math.random() - 0.5) * 2;
      }
    }
    
    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.particles, 3));
    
    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(this.canvas.width, this.canvas.height) },
        u_audioIntensity: { value: 0 },
        u_highFreq: { value: 0 },
        u_melody: { value: 0 },
        u_hue: { value: 0 }
      },
      vertexShader: `
        uniform float u_time;
        uniform float u_audioIntensity;
        uniform float u_highFreq;
        
        varying float vAlpha;
        
        void main() {
          vec3 pos = position;
          
          // Neural signal propagation
          pos += vec3(
            sin(u_time * 3.0) * u_highFreq * 0.05,
            cos(u_time * 2.5) * u_audioIntensity * 0.03,
            sin(u_time * 1.8) * 0.01
          );
          
          gl_Position = vec4(pos, 1.0);
          gl_PointSize = 1.5 + u_audioIntensity * 2.0;
          
          vAlpha = 0.4 + u_audioIntensity * 0.6;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        
        void main() {
          float distance = length(gl_PointCoord - vec2(0.5));
          float alpha = (1.0 - smoothstep(0.0, 0.5, distance)) * vAlpha;
          
          // Bright white particles with subtle blue tint
          vec3 color = vec3(1.0, 1.0, 1.0);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    
    this.particleSystem = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particleSystem);
  }

  update(deltaTime: number, events: AudioEvent[], analysis: AnalysisFrame): void {
    this.time += deltaTime;
    
    // Update audio reactive parameters
    this.audioIntensity = analysis.rms;
    this.lowFrequency = analysis.low;
    this.midFrequency = analysis.mid;
    this.highFrequency = analysis.high;
    
    // Update musical elements
    this.bassDrum = analysis.bassDrum;
    this.snare = analysis.snare;
    this.hihat = analysis.hihat;
    this.kick = analysis.kick;
    this.vocal = analysis.vocal;
    this.melody = analysis.melody;
    
    // Update color control
    this.hue = analysis.hue;
    this.saturation = analysis.saturation;
    this.brightness = analysis.brightness;
    
    // Update materials with musical elements
    this.nodeMaterial.uniforms.u_time.value = this.time;
    this.nodeMaterial.uniforms.u_audioIntensity.value = this.audioIntensity;
    this.nodeMaterial.uniforms.u_lowFreq.value = this.lowFrequency;
    this.nodeMaterial.uniforms.u_midFreq.value = this.midFrequency;
    this.nodeMaterial.uniforms.u_highFreq.value = this.highFrequency;
    this.nodeMaterial.uniforms.u_bassDrum.value = this.bassDrum;
    this.nodeMaterial.uniforms.u_snare.value = this.snare;
    this.nodeMaterial.uniforms.u_hue.value = this.hue;
    this.nodeMaterial.uniforms.u_saturation.value = this.saturation;
    this.nodeMaterial.uniforms.u_brightness.value = this.brightness;
    
    this.lineMaterial.uniforms.u_time.value = this.time;
    this.lineMaterial.uniforms.u_audioIntensity.value = this.audioIntensity;
    this.lineMaterial.uniforms.u_midFreq.value = this.midFrequency;
    this.lineMaterial.uniforms.u_highFreq.value = this.highFrequency;
    this.lineMaterial.uniforms.u_hihat.value = this.hihat;
    this.lineMaterial.uniforms.u_hue.value = this.hue;
    
    this.particleMaterial.uniforms.u_time.value = this.time;
    this.particleMaterial.uniforms.u_audioIntensity.value = this.audioIntensity;
    this.particleMaterial.uniforms.u_highFreq.value = this.highFrequency;
    this.particleMaterial.uniforms.u_melody.value = this.melody;
    this.particleMaterial.uniforms.u_hue.value = this.hue;
    
    // Update particle positions for neural signal propagation
    this.updateParticles(events);
  }

  private updateParticles(events: AudioEvent[]): void {
    const positions = this.particleGeometry.getAttribute('position') as THREE.BufferAttribute;
    
    for (let i = 0; i < this.particleCount; i++) {
      const index = i * 3;
      
      // Neural signal propagation along connections
      if (this.connections.length > 0) {
        const connection = this.connections[Math.floor(Math.random() * this.connections.length)];
        const fromNode = this.nodes[connection.from];
        const toNode = this.nodes[connection.to];
        
        // Move particle along the connection
        const t = (Math.sin(this.time * 2.0 + i * 0.1) + 1.0) * 0.5; // 0 to 1
        positions.array[index] = fromNode.x + (toNode.x - fromNode.x) * t;
        positions.array[index + 1] = fromNode.y + (toNode.y - fromNode.y) * t;
        positions.array[index + 2] = fromNode.z + (toNode.z - fromNode.z) * t;
      }
      
      // Audio reactive movement
      if (events.length > 0) {
        const event = events[Math.floor(Math.random() * events.length)];
        positions.array[index] += Math.sin(this.time * 3.0) * event.energy * 0.02;
        positions.array[index + 1] += Math.cos(this.time * 2.5) * event.energy * 0.015;
        positions.array[index + 2] += Math.sin(this.time * 1.8) * event.energy * 0.01;
      }
    }
    
    positions.needsUpdate = true;
  }

  render(): void {
    try {
      if (this.scene && this.camera && this.renderer) {
        this.renderer.render(this.scene, this.camera);
      } else {
        console.error('NeuralCircuitRenderer: Missing scene, camera, or renderer', {
          scene: !!this.scene,
          camera: !!this.camera,
          renderer: !!this.renderer
        });
      }
    } catch (error) {
      console.error('NeuralCircuitRenderer render error:', error);
    }
  }

  dispose(): void {
    this.renderer.dispose();
    this.nodeGeometry.dispose();
    this.nodeMaterial.dispose();
    this.lineGeometry.dispose();
    this.lineMaterial.dispose();
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
  }
}
