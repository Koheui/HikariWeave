import * as THREE from 'three';
import type { AudioEvent, AnalysisFrame } from '../audio/AudioEngine';

export class VolcanicCoreRenderer {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  
  // Main volcanic core geometry
  private coreGeometry: THREE.PlaneGeometry;
  private coreMaterial: THREE.ShaderMaterial;
  private coreMesh: THREE.Mesh;
  
  // Volcanic layers
  private layerGeometry: THREE.PlaneGeometry;
  private layerMaterial: THREE.ShaderMaterial;
  private layerMesh: THREE.Mesh;
  
  // Glowing lines/cracks
  private lineGeometry: THREE.BufferGeometry;
  private lineMaterial: THREE.ShaderMaterial;
  private lineSystem: THREE.LineSegments;
  
  // Particle system for volcanic debris
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.ShaderMaterial;
  private particleSystem: THREE.Points;
  private particles: Float32Array;
  private particleCount = 1000;
  
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
  
  // Volcanic parameters
  private vortexCenter = new THREE.Vector2(0.3, -0.2); // Bottom-right vortex center
  private coreRadius = 0.4;
  private layerCount = 5;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupRenderer();
    this.setupScene();
    this.setupCore();
    this.setupLayers();
    this.setupGlowingLines();
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

  private setupCore(): void {
    this.coreGeometry = new THREE.PlaneGeometry(2, 2);
    
    this.coreMaterial = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(this.canvas.width, this.canvas.height) },
        u_audioIntensity: { value: 0 },
        u_lowFreq: { value: 0 },
        u_midFreq: { value: 0 },
        u_highFreq: { value: 0 },
        u_vortexCenter: { value: this.vortexCenter },
        u_coreRadius: { value: this.coreRadius },
        u_bassDrum: { value: 0 },
        u_kick: { value: 0 },
        u_hue: { value: 0 },
        u_saturation: { value: 0 },
        u_brightness: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform float u_audioIntensity;
        uniform float u_lowFreq;
        uniform float u_midFreq;
        uniform float u_highFreq;
        uniform vec2 u_vortexCenter;
        uniform float u_coreRadius;
        
        varying vec2 vUv;
        
        // Noise functions
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 6; i++) {
            value += amplitude * noise(p);
            p *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }
        
        // SDF for the core void
        float coreVoid(vec2 uv) {
          vec2 center = vec2(0.5, 0.5);
          float distance = length(uv - center);
          return smoothstep(u_coreRadius - 0.1, u_coreRadius, distance);
        }
        
        // Volcanic layer function
        float volcanicLayer(vec2 uv, float layerIndex) {
          vec2 center = vec2(0.5, 0.5);
          float distance = length(uv - center);
          
          // Create organic layer boundaries
          float layerRadius = u_coreRadius + layerIndex * 0.15;
          float layerNoise = fbm(uv * 3.0 + u_time * 0.1 + layerIndex);
          layerRadius += layerNoise * 0.05;
          
          float layer = 1.0 - smoothstep(layerRadius - 0.08, layerRadius + 0.08, distance);
          
          // Add volcanic texture
          float texture = fbm(uv * 8.0 + u_time * 0.2);
          layer *= (0.7 + texture * 0.3);
          
          return layer;
        }
        
        void main() {
          vec2 uv = vUv;
          
          // Create the deep void at center
          float voidMask = coreVoid(uv);
          
          // Create volcanic layers
          float totalLayers = 0.0;
          for (int i = 1; i <= 5; i++) {
            float layer = volcanicLayer(uv, float(i));
            totalLayers += layer;
          }
          
          // Vortex effect
          vec2 vortexPos = uv - u_vortexCenter;
          float vortexAngle = atan(vortexPos.y, vortexPos.x);
          float vortexDistance = length(vortexPos);
          
          // Spiral distortion
          float spiral = sin(vortexAngle * 8.0 - vortexDistance * 15.0 + u_time * 2.0);
          float vortexEffect = 1.0 - smoothstep(0.0, 0.8, vortexDistance);
          vortexEffect *= (0.5 + spiral * 0.5);
          
          // Combine layers with vortex
          float finalShape = totalLayers * vortexEffect;
          
          // Color mapping based on depth and audio
          vec3 color = vec3(0.0);
          
          if (voidMask > 0.8) {
            // Deep void - pure black
            color = vec3(0.0);
          } else if (finalShape > 0.1) {
            // Volcanic layers - red to orange gradient
            float depth = 1.0 - voidMask;
            vec3 redCore = vec3(0.8, 0.1, 0.0); // Deep red
            vec3 orangeEdge = vec3(1.0, 0.4, 0.0); // Orange
            vec3 yellowOuter = vec3(1.0, 0.8, 0.2); // Yellow-white
            
            color = mix(redCore, orangeEdge, depth * 2.0);
            color = mix(color, yellowOuter, depth * 3.0);
            
            // Add audio reactive pulsing
            float pulse = sin(u_time * 3.0 + u_lowFreq * 5.0) * 0.2 + 0.8;
            color *= pulse;
            
            // Add mid-frequency texture variation
            float textureVariation = fbm(uv * 12.0 + u_time * 0.3);
            color *= (0.8 + textureVariation * 0.2);
          }
          
          // Add high-frequency sparkles
          float sparkles = fbm(uv * 20.0 + u_time * 0.5);
          if (sparkles > 0.9) {
            color += vec3(1.0, 0.9, 0.7) * u_highFreq * 0.5;
          }
          
          // Audio reactive intensity
          color *= (0.5 + u_audioIntensity * 0.5);
          
          gl_FragColor = vec4(color, finalShape);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    
    this.coreMesh = new THREE.Mesh(this.coreGeometry, this.coreMaterial);
    this.scene.add(this.coreMesh);
  }

  private setupLayers(): void {
    this.layerGeometry = new THREE.PlaneGeometry(2, 2);
    
    this.layerMaterial = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(this.canvas.width, this.canvas.height) },
        u_audioIntensity: { value: 0 },
        u_midFreq: { value: 0 },
        u_vortexCenter: { value: this.vortexCenter },
        u_snare: { value: 0 },
        u_hue: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform float u_audioIntensity;
        uniform float u_midFreq;
        uniform vec2 u_vortexCenter;
        
        varying vec2 vUv;
        
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
          vec2 uv = vUv;
          
          // Create flowing lava patterns
          float lavaFlow = 0.0;
          for (int i = 0; i < 3; i++) {
            float flow = sin(uv.x * 5.0 + uv.y * 3.0 + u_time * 0.5 + float(i) * 2.0);
            lavaFlow += flow * 0.3;
          }
          
          // Vortex distortion
          vec2 vortexPos = uv - u_vortexCenter;
          float vortexAngle = atan(vortexPos.y, vortexPos.x);
          float vortexDistance = length(vortexPos);
          
          float spiral = sin(vortexAngle * 6.0 - vortexDistance * 10.0 + u_time * 1.5);
          float vortexMask = 1.0 - smoothstep(0.0, 0.6, vortexDistance);
          
          lavaFlow *= vortexMask * (0.5 + spiral * 0.5);
          
          // Add texture
          float texture = noise(uv * 8.0 + u_time * 0.2);
          lavaFlow *= (0.6 + texture * 0.4);
          
          // Audio reactive intensity
          lavaFlow *= (0.3 + u_audioIntensity * 0.7);
          lavaFlow *= (0.5 + u_midFreq * 0.5);
          
          // Color - deep red with orange highlights
          vec3 color = vec3(0.6, 0.1, 0.0); // Deep red
          color = mix(color, vec3(1.0, 0.3, 0.0), lavaFlow); // Orange highlights
          
          gl_FragColor = vec4(color, lavaFlow * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    
    this.layerMesh = new THREE.Mesh(this.layerGeometry, this.layerMaterial);
    this.scene.add(this.layerMesh);
  }

  private setupGlowingLines(): void {
    // Generate glowing lines/cracks
    const lineCount = 50;
    const linePositions = new Float32Array(lineCount * 6); // 2 points per line
    
    for (let i = 0; i < lineCount; i++) {
      // Create lines radiating from the vortex center
      const angle = (i / lineCount) * Math.PI * 2;
      const length = 0.3 + Math.random() * 0.4;
      
      const startX = this.vortexCenter.x;
      const startY = this.vortexCenter.y;
      const endX = startX + Math.cos(angle) * length;
      const endY = startY + Math.sin(angle) * length;
      
      // Start point
      linePositions[i * 6] = startX;
      linePositions[i * 6 + 1] = startY;
      linePositions[i * 6 + 2] = 0;
      
      // End point
      linePositions[i * 6 + 3] = endX;
      linePositions[i * 6 + 4] = endY;
      linePositions[i * 6 + 5] = 0;
    }

    this.lineGeometry = new THREE.BufferGeometry();
    this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    this.lineMaterial = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(this.canvas.width, this.canvas.height) },
        u_audioIntensity: { value: 0 },
        u_highFreq: { value: 0 },
        u_hihat: { value: 0 },
        u_hue: { value: 0 }
      },
      vertexShader: `
        uniform float u_time;
        uniform float u_audioIntensity;
        
        varying float vAlpha;
        varying float vDistance;
        
        void main() {
          vec3 pos = position;
          
          // Subtle movement
          pos += vec3(
            sin(u_time * 2.0 + pos.x * 10.0) * 0.01,
            cos(u_time * 1.5 + pos.y * 10.0) * 0.01,
            0.0
          );
          
          gl_Position = vec4(pos, 1.0);
          
          vDistance = float(gl_VertexID % 2) * 2.0 - 1.0;
          vAlpha = 0.4 + u_audioIntensity * 0.6;
        }
      `,
      fragmentShader: `
        uniform float u_time;
        uniform float u_highFreq;
        
        varying float vAlpha;
        varying float vDistance;
        
        void main() {
          // Create flowing energy effect
          float energy = sin(vDistance * 8.0 + u_time * 3.0) * 0.5 + 0.5;
          
          // Bright red-orange color
          vec3 color = vec3(1.0, 0.3, 0.0);
          color += vec3(0.2, 0.1, 0.0) * u_highFreq;
          
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
    
    // Initialize particle positions around the vortex
    for (let i = 0; i < this.particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 0.8;
      
      this.particles[i * 3] = this.vortexCenter.x + Math.cos(angle) * distance;
      this.particles[i * 3 + 1] = this.vortexCenter.y + Math.sin(angle) * distance;
      this.particles[i * 3 + 2] = Math.random() * 0.5; // z depth
    }
    
    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.particles, 3));
    
    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(this.canvas.width, this.canvas.height) },
        u_audioIntensity: { value: 0 },
        u_highFreq: { value: 0 },
        u_vortexCenter: { value: this.vortexCenter },
        u_vocal: { value: 0 },
        u_hue: { value: 0 }
      },
      vertexShader: `
        uniform float u_time;
        uniform float u_audioIntensity;
        uniform float u_highFreq;
        uniform vec2 u_vortexCenter;
        
        varying float vAlpha;
        
        void main() {
          vec3 pos = position;
          
          // Spiral movement around vortex center
          vec2 vortexPos = pos.xy - u_vortexCenter;
          float angle = atan(vortexPos.y, vortexPos.x);
          float distance = length(vortexPos);
          
          // Spiral inward/outward
          angle += u_time * 0.5;
          distance += sin(u_time * 2.0 + angle * 3.0) * 0.02;
          
          pos.x = u_vortexCenter.x + cos(angle) * distance;
          pos.y = u_vortexCenter.y + sin(angle) * distance;
          
          // Audio reactive movement
          pos += vec3(
            sin(u_time * 3.0) * u_highFreq * 0.05,
            cos(u_time * 2.5) * u_audioIntensity * 0.03,
            0.0
          );
          
          gl_Position = vec4(pos, 1.0);
          gl_PointSize = 2.0 + u_audioIntensity * 3.0;
          
          vAlpha = 0.3 + u_audioIntensity * 0.7;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        
        void main() {
          float distance = length(gl_PointCoord - vec2(0.5));
          float alpha = (1.0 - smoothstep(0.0, 0.5, distance)) * vAlpha;
          
          // Orange-red particles
          vec3 color = vec3(1.0, 0.4, 0.0);
          
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
    this.coreMaterial.uniforms.u_time.value = this.time;
    this.coreMaterial.uniforms.u_audioIntensity.value = this.audioIntensity;
    this.coreMaterial.uniforms.u_lowFreq.value = this.lowFrequency;
    this.coreMaterial.uniforms.u_midFreq.value = this.midFrequency;
    this.coreMaterial.uniforms.u_highFreq.value = this.highFrequency;
    this.coreMaterial.uniforms.u_bassDrum.value = this.bassDrum;
    this.coreMaterial.uniforms.u_kick.value = this.kick;
    this.coreMaterial.uniforms.u_hue.value = this.hue;
    this.coreMaterial.uniforms.u_saturation.value = this.saturation;
    this.coreMaterial.uniforms.u_brightness.value = this.brightness;
    
    this.layerMaterial.uniforms.u_time.value = this.time;
    this.layerMaterial.uniforms.u_audioIntensity.value = this.audioIntensity;
    this.layerMaterial.uniforms.u_midFreq.value = this.midFrequency;
    this.layerMaterial.uniforms.u_snare.value = this.snare;
    this.layerMaterial.uniforms.u_hue.value = this.hue;
    
    this.lineMaterial.uniforms.u_time.value = this.time;
    this.lineMaterial.uniforms.u_audioIntensity.value = this.audioIntensity;
    this.lineMaterial.uniforms.u_highFreq.value = this.highFrequency;
    this.lineMaterial.uniforms.u_hihat.value = this.hihat;
    this.lineMaterial.uniforms.u_hue.value = this.hue;
    
    this.particleMaterial.uniforms.u_time.value = this.time;
    this.particleMaterial.uniforms.u_audioIntensity.value = this.audioIntensity;
    this.particleMaterial.uniforms.u_highFreq.value = this.highFrequency;
    this.particleMaterial.uniforms.u_vocal.value = this.vocal;
    this.particleMaterial.uniforms.u_hue.value = this.hue;
    
    // Update particle positions for volcanic activity
    this.updateParticles(events);
  }

  private updateParticles(events: AudioEvent[]): void {
    const positions = this.particleGeometry.getAttribute('position') as THREE.BufferAttribute;
    
    for (let i = 0; i < this.particleCount; i++) {
      const index = i * 3;
      
      // Spiral movement around vortex center
      const vortexPos = new THREE.Vector2(
        positions.array[index] - this.vortexCenter.x,
        positions.array[index + 1] - this.vortexCenter.y
      );
      
      const angle = Math.atan2(vortexPos.y, vortexPos.x);
      const distance = vortexPos.length();
      
      // Spiral inward/outward
      const newAngle = angle + this.time * 0.5;
      const newDistance = distance + Math.sin(this.time * 2.0 + angle * 3.0) * 0.02;
      
      positions.array[index] = this.vortexCenter.x + Math.cos(newAngle) * newDistance;
      positions.array[index + 1] = this.vortexCenter.y + Math.sin(newAngle) * newDistance;
      
      // Audio reactive movement
      if (events.length > 0) {
        const event = events[Math.floor(Math.random() * events.length)];
        positions.array[index] += Math.sin(this.time * 3.0) * event.energy * 0.03;
        positions.array[index + 1] += Math.cos(this.time * 2.5) * event.energy * 0.02;
      }
      
      // Keep particles in bounds
      if (positions.array[index] > 1) positions.array[index] = -1;
      if (positions.array[index] < -1) positions.array[index] = 1;
      if (positions.array[index + 1] > 1) positions.array[index + 1] = -1;
      if (positions.array[index + 1] < -1) positions.array[index + 1] = 1;
    }
    
    positions.needsUpdate = true;
  }

  render(): void {
    try {
      if (this.scene && this.camera && this.renderer) {
        this.renderer.render(this.scene, this.camera);
      } else {
        console.error('VolcanicCoreRenderer: Missing scene, camera, or renderer', {
          scene: !!this.scene,
          camera: !!this.camera,
          renderer: !!this.renderer
        });
      }
    } catch (error) {
      console.error('VolcanicCoreRenderer render error:', error);
    }
  }

  dispose(): void {
    this.renderer.dispose();
    this.coreGeometry.dispose();
    this.coreMaterial.dispose();
    this.layerGeometry.dispose();
    this.layerMaterial.dispose();
    this.lineGeometry.dispose();
    this.lineMaterial.dispose();
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
  }
}
