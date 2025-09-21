import * as THREE from 'three';
import type { AudioEvent, AnalysisFrame } from '../audio/AudioEngine';

export class JellyfishPulsesRenderer {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  
  // Main jellyfish geometry
  private jellyfishGeometry: THREE.PlaneGeometry;
  private jellyfishMaterial: THREE.ShaderMaterial;
  private jellyfishMesh: THREE.Mesh;
  
  // Particle system for bioluminescence
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.ShaderMaterial;
  private particleSystem: THREE.Points;
  private particles: Float32Array;
  private particleCount = 5000; // Increased particle count
  
  // Vortex/whirlpool effect
  private vortexGeometry: THREE.PlaneGeometry;
  private vortexMaterial: THREE.ShaderMaterial;
  private vortexMesh: THREE.Mesh;
  
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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupRenderer();
    this.setupScene();
    this.setupJellyfish();
    this.setupParticles();
    this.setupVortex();
    
    // Ensure all objects are properly added to scene
    console.log('JellyfishPulsesRenderer scene children:', this.scene.children.length);
  }

  private setupRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    
    // High resolution rendering
    const pixelRatio = Math.min(window.devicePixelRatio, 2); // Cap at 2x for performance
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
    this.scene.background = new THREE.Color(0x000011); // Deep blue background
    
    // Setup camera
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  private setupJellyfish(): void {
    this.jellyfishGeometry = new THREE.PlaneGeometry(2, 2);
    
    this.jellyfishMaterial = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(this.canvas.width, this.canvas.height) },
        u_audioIntensity: { value: 0 },
        u_lowFreq: { value: 0 },
        u_midFreq: { value: 0 },
        u_highFreq: { value: 0 },
        u_bassDrum: { value: 0 },
        u_snare: { value: 0 },
        u_hihat: { value: 0 },
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
        uniform float u_bassDrum;
        uniform float u_snare;
        uniform float u_hihat;
        uniform float u_hue;
        uniform float u_saturation;
        uniform float u_brightness;
        
        varying vec2 vUv;
        
        // Noise function
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
        
        // HSV to RGB conversion
        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }
        
        void main() {
          vec2 uv = vUv;
          vec2 center = vec2(0.3, 0.5); // Left side position
          
          // Enhanced jellyfish body with multiple layers
          vec2 jellyfishPos = uv - center;
          float distance = length(jellyfishPos);
          
          // Create flowing tentacle-like shapes with more detail
          float angle = atan(jellyfishPos.y, jellyfishPos.x);
          float tentacle = sin(angle * 12.0 + u_time * 0.8) * 0.15;
          float tentacle2 = sin(angle * 6.0 + u_time * 0.3) * 0.08;
          float jellyfishShape = 1.0 - smoothstep(0.0, 0.25 + tentacle + tentacle2, distance);
          
          // Add multiple pulsing layers
          float pulse1 = sin(u_time * 2.0 + u_lowFreq * 8.0) * 0.15 + 0.85;
          float pulse2 = sin(u_time * 3.5 + u_midFreq * 6.0) * 0.1 + 0.9;
          jellyfishShape *= pulse1 * pulse2;
          
          // Enhanced organic noise for texture
          float organicNoise = fbm(uv * 6.0 + u_time * 0.2);
          float fineNoise = fbm(uv * 12.0 + u_time * 0.5);
          jellyfishShape *= (0.6 + organicNoise * 0.3 + fineNoise * 0.1);
          
          // Add bioluminescent particles
          float particles = 0.0;
          for (int i = 0; i < 15; i++) {
            vec2 particlePos = center + vec2(
              sin(u_time * 1.8 + float(i) * 0.4) * 0.4,
              cos(u_time * 1.3 + float(i) * 0.6) * 0.3
            );
            float particleRadius = 0.03 + u_highFreq * 0.02;
            float particleDist = length(uv - particlePos);
            particles += (1.0 - smoothstep(0.0, particleRadius, particleDist)) * 0.7;
          }
          
          jellyfishShape += particles * u_audioIntensity;
          
          // Enhanced color system with HSV support
          vec3 baseColor = vec3(1.0, 0.4, 0.2); // Orange
          vec3 edgeColor = vec3(0.2, 0.6, 1.0); // Blue
          
          // Apply user-controlled hue, saturation, brightness
          float hueShift = u_hue;
          float saturation = u_saturation;
          float brightness = u_brightness;
          
          // Convert to HSV and apply user controls
          vec3 hsv = vec3(hueShift, saturation, brightness);
          vec3 userColor = hsv2rgb(hsv);
          
          // Mix original gradient with user color
          vec3 jellyfishColor = mix(baseColor, edgeColor, distance * 2.0);
          jellyfishColor = mix(jellyfishColor, userColor, 0.6);
          
          // Add enhanced glow effect
          float glow = jellyfishShape * (0.6 + u_audioIntensity * 0.4);
          jellyfishColor += vec3(glow * 0.5) * userColor;
          
          // Add sparkles for high frequencies
          float sparkles = fbm(uv * 25.0 + u_time * 1.0);
          if (sparkles > 0.92) {
            jellyfishColor += vec3(1.0, 0.9, 0.7) * u_highFreq * 0.8;
          }
          
          // Final output with enhanced contrast and depth
          vec3 finalColor = jellyfishColor * jellyfishShape;
          float alpha = jellyfishShape * (0.9 + u_audioIntensity * 0.1);
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    
    this.jellyfishMesh = new THREE.Mesh(this.jellyfishGeometry, this.jellyfishMaterial);
    this.scene.add(this.jellyfishMesh);
  }

  private setupParticles(): void {
    this.particles = new Float32Array(this.particleCount * 3);
    
    // Initialize particle positions
    for (let i = 0; i < this.particleCount; i++) {
      this.particles[i * 3] = (Math.random() - 0.5) * 4; // x
      this.particles[i * 3 + 1] = (Math.random() - 0.5) * 4; // y
      this.particles[i * 3 + 2] = Math.random() * 2; // z (depth)
    }
    
    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.particles, 3));
    
    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(this.canvas.width, this.canvas.height) },
        u_audioIntensity: { value: 0 },
        u_highFreq: { value: 0 },
        u_hihat: { value: 0 },
        u_hue: { value: 0 }
      },
      vertexShader: `
        attribute vec3 position;
        uniform float u_time;
        uniform float u_audioIntensity;
        uniform float u_highFreq;
        uniform float u_hihat;
        
        varying float vAlpha;
        varying float vSize;
        varying vec3 vColor;
        
        void main() {
          vec3 pos = position;
          
          // Enhanced floating motion with multiple frequencies
          pos.y += sin(u_time * 0.8 + pos.x * 0.7) * 0.15;
          pos.x += cos(u_time * 0.5 + pos.y * 0.4) * 0.1;
          pos.z += sin(u_time * 0.6 + pos.x * 0.3) * 0.05;
          
          // Audio reactive movement with more dynamics
          pos += vec3(
            sin(u_time * 3.0) * u_highFreq * 0.3,
            cos(u_time * 2.2) * u_audioIntensity * 0.2,
            sin(u_time * 1.8) * u_hihat * 0.1
          );
          
          gl_Position = vec4(pos, 1.0);
          
          // Dynamic particle size
          vSize = 3.0 + u_audioIntensity * 5.0 + u_highFreq * 3.0;
          gl_PointSize = vSize;
          
          // Enhanced alpha with depth
          vAlpha = 0.4 + u_audioIntensity * 0.6 + u_highFreq * 0.3;
          
          // Color variation based on position and audio
          vColor = vec3(
            0.8 + sin(pos.x * 2.0) * 0.2,
            0.6 + cos(pos.y * 2.0) * 0.3,
            1.0 + sin(u_time + pos.z) * 0.2
          );
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying float vSize;
        varying vec3 vColor;
        
        void main() {
          float distance = length(gl_PointCoord - vec2(0.5));
          
          // Enhanced particle shape with soft edges
          float alpha = (1.0 - smoothstep(0.0, 0.5, distance)) * vAlpha;
          
          // Add inner glow
          float innerGlow = 1.0 - smoothstep(0.0, 0.3, distance);
          alpha += innerGlow * 0.3;
          
          // Enhanced color with glow effect
          vec3 color = vColor;
          color += vec3(innerGlow * 0.5); // Add white glow to center
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    
    this.particleSystem = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particleSystem);
  }

  private setupVortex(): void {
    this.vortexGeometry = new THREE.PlaneGeometry(2, 2);
    
    this.vortexMaterial = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(this.canvas.width, this.canvas.height) },
        u_audioIntensity: { value: 0 },
        u_midFreq: { value: 0 },
        u_bassDrum: { value: 0 }
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
        
        varying vec2 vUv;
        
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
          vec2 uv = vUv;
          vec2 center = vec2(0.7, 0.3); // Right side position
          
          // Create vortex/whirlpool effect
          vec2 vortexPos = uv - center;
          float angle = atan(vortexPos.y, vortexPos.x);
          float distance = length(vortexPos);
          
          // Spiral pattern
          float spiral = sin(angle * 8.0 - distance * 20.0 + u_time * 2.0);
          float vortexShape = 1.0 - smoothstep(0.0, 0.4, distance);
          vortexShape *= (0.5 + spiral * 0.5);
          
          // Add audio reactive pulsing
          float pulse = sin(u_time * 3.0 + u_midFreq * 8.0) * 0.2 + 0.8;
          vortexShape *= pulse;
          
          // Add turbulence
          float turbulence = noise(uv * 8.0 + u_time * 0.5) * 0.3;
          vortexShape *= (0.7 + turbulence);
          
          // Color - bright cyan/white center, fading to blue
          vec3 centerColor = vec3(0.8, 1.0, 1.0); // Bright cyan
          vec3 edgeColor = vec3(0.1, 0.3, 0.8); // Deep blue
          vec3 vortexColor = mix(centerColor, edgeColor, distance * 1.5);
          
          // Add glow effect
          float glow = vortexShape * (0.3 + u_audioIntensity * 0.7);
          vortexColor += vec3(glow * 0.5);
          
          gl_FragColor = vec4(vortexColor * vortexShape, vortexShape);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    
    this.vortexMesh = new THREE.Mesh(this.vortexGeometry, this.vortexMaterial);
    this.scene.add(this.vortexMesh);
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
    this.jellyfishMaterial.uniforms.u_time.value = this.time;
    this.jellyfishMaterial.uniforms.u_audioIntensity.value = this.audioIntensity;
    this.jellyfishMaterial.uniforms.u_lowFreq.value = this.lowFrequency;
    this.jellyfishMaterial.uniforms.u_midFreq.value = this.midFrequency;
    this.jellyfishMaterial.uniforms.u_highFreq.value = this.highFrequency;
    this.jellyfishMaterial.uniforms.u_bassDrum.value = this.bassDrum;
    this.jellyfishMaterial.uniforms.u_snare.value = this.snare;
    this.jellyfishMaterial.uniforms.u_hihat.value = this.hihat;
    this.jellyfishMaterial.uniforms.u_hue.value = this.hue;
    this.jellyfishMaterial.uniforms.u_saturation.value = this.saturation;
    this.jellyfishMaterial.uniforms.u_brightness.value = this.brightness;
    
    this.particleMaterial.uniforms.u_time.value = this.time;
    this.particleMaterial.uniforms.u_audioIntensity.value = this.audioIntensity;
    this.particleMaterial.uniforms.u_highFreq.value = this.highFrequency;
    this.particleMaterial.uniforms.u_hihat.value = this.hihat;
    this.particleMaterial.uniforms.u_hue.value = this.hue;
    
    this.vortexMaterial.uniforms.u_time.value = this.time;
    this.vortexMaterial.uniforms.u_audioIntensity.value = this.audioIntensity;
    this.vortexMaterial.uniforms.u_midFreq.value = this.midFrequency;
    this.vortexMaterial.uniforms.u_bassDrum.value = this.bassDrum;
    
    // Update particle positions for bioluminescence effect
    this.updateParticles(events);
  }

  private updateParticles(events: AudioEvent[]): void {
    const positions = this.particleGeometry.getAttribute('position') as THREE.BufferAttribute;
    
    for (let i = 0; i < this.particleCount; i++) {
      const index = i * 3;
      
      // Gentle floating motion
      positions.array[index + 1] += Math.sin(this.time * 0.5 + positions.array[index] * 0.5) * 0.001;
      positions.array[index] += Math.cos(this.time * 0.3 + positions.array[index + 1] * 0.3) * 0.0005;
      
      // Audio reactive movement
      if (events.length > 0) {
        const event = events[Math.floor(Math.random() * events.length)];
        positions.array[index] += Math.sin(this.time * 2.0) * event.energy * 0.01;
        positions.array[index + 1] += Math.cos(this.time * 1.5) * event.energy * 0.005;
      }
      
      // Keep particles in bounds
      if (positions.array[index] > 2) positions.array[index] = -2;
      if (positions.array[index] < -2) positions.array[index] = 2;
      if (positions.array[index + 1] > 2) positions.array[index + 1] = -2;
      if (positions.array[index + 1] < -2) positions.array[index + 1] = 2;
    }
    
    positions.needsUpdate = true;
  }

  render(): void {
    try {
      if (this.scene && this.camera && this.renderer) {
        this.renderer.render(this.scene, this.camera);
      } else {
        console.error('JellyfishPulsesRenderer: Missing scene, camera, or renderer', {
          scene: !!this.scene,
          camera: !!this.camera,
          renderer: !!this.renderer
        });
      }
    } catch (error) {
      console.error('JellyfishPulsesRenderer render error:', error);
    }
  }

  dispose(): void {
    this.renderer.dispose();
    this.jellyfishGeometry.dispose();
    this.jellyfishMaterial.dispose();
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
    this.vortexGeometry.dispose();
    this.vortexMaterial.dispose();
  }
}
