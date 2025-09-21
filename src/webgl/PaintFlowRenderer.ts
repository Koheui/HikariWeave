import * as THREE from 'three';
import type { AudioEvent, AnalysisFrame } from '../audio/AudioEngine';

export class PaintFlowRenderer {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  
  // Paint flow materials
  private topPaintMaterial: THREE.ShaderMaterial;
  private bottomPaintMaterial: THREE.ShaderMaterial;
  private topPaintMesh: THREE.Mesh;
  private bottomPaintMesh: THREE.Mesh;
  
  // Glitter particle system
  private glitterGeometry: THREE.BufferGeometry;
  private glitterMaterial: THREE.ShaderMaterial;
  private glitterSystem: THREE.Points;
  private glitterParticles: Float32Array;
  private glitterCount = 15000; // Increased for more density
  
  // Audio reactive properties
  private audioIntensity = 0;
  private lowFreq = 0;
  private midFreq = 0;
  private highFreq = 0;
  private bassDrum = 0;
  private snare = 0;
  private hihat = 0;
  private kick = 0;
  private vocal = 0;
  private melody = 0;
  private hue = 0;
  private saturation = 0;
  private brightness = 0;
  private beatPhase = 0;
  
  private time = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.initialize();
  }

  private initialize(): void {
    this.setupRenderer();
    this.setupScene();
    this.setupPaintFlows();
    this.setupGlitter();
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
    this.scene.background = new THREE.Color(0x050510); // Very dark blue background like reference image
    
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  private setupPaintFlows(): void {
    // Top paint flow (coming from top)
    this.topPaintMaterial = new THREE.ShaderMaterial({
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
        u_kick: { value: 0 },
        u_vocal: { value: 0 },
        u_melody: { value: 0 },
        u_hue: { value: 0 },
        u_saturation: { value: 0 },
        u_brightness: { value: 0 },
        u_beatPhase: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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
        uniform float u_kick;
        uniform float u_vocal;
        uniform float u_melody;
        uniform float u_hue;
        uniform float u_saturation;
        uniform float u_brightness;
        uniform float u_beatPhase;
        
        varying vec2 vUv;
        
        // Enhanced noise functions
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          
          for (int i = 0; i < 6; i++) {
            value += amplitude * noise(p * frequency);
            amplitude *= 0.5;
            frequency *= 2.0;
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
          
          // Top paint flow - starts from top edge with more complex patterns
          float topFlow = 1.0 - uv.y; // Distance from top
          
          // Enhanced flowing motion with multiple frequencies
          float flowSpeed1 = 0.2 + u_audioIntensity * 0.3;
          float flowSpeed2 = 0.4 + u_midFreq * 0.2;
          float flowOffset1 = sin(u_time * flowSpeed1 + uv.x * 4.0) * 0.15;
          float flowOffset2 = cos(u_time * flowSpeed2 + uv.x * 2.0) * 0.08;
          topFlow += flowOffset1 + flowOffset2;
          
          // Add complex organic paint texture with multiple layers
          float paintTexture1 = fbm(uv * 6.0 + u_time * 0.15);
          float paintTexture2 = fbm(uv * 12.0 + u_time * 0.25);
          float paintTexture3 = fbm(uv * 24.0 + u_time * 0.35);
          topFlow *= (0.5 + paintTexture1 * 0.3 + paintTexture2 * 0.15 + paintTexture3 * 0.05);
          
          // Enhanced audio reactive pulsing with multiple harmonics
          float pulse1 = sin(u_time * 1.5 + u_lowFreq * 10.0) * 0.25 + 0.75;
          float pulse2 = sin(u_time * 3.0 + u_midFreq * 8.0) * 0.15 + 0.85;
          float pulse3 = sin(u_time * 6.0 + u_highFreq * 6.0) * 0.1 + 0.9;
          topFlow *= pulse1 * pulse2 * pulse3;
          
          // Create more organic paint drop shape with multiple curves
          float paintShape = smoothstep(0.0, 0.4, topFlow);
          paintShape *= smoothstep(0.7, 0.0, topFlow); // Fade out at bottom
          
          // Add complex paint drips with varying patterns
          float drips = 0.0;
          for (int i = 0; i < 8; i++) {
            float dripX = 0.1 + float(i) * 0.11;
            float dripWidth = 0.03 + u_hihat * 0.04 + sin(u_time * 2.0 + float(i)) * 0.02;
            float dripLength = 0.5 + u_midFreq * 0.3 + u_bassDrum * 0.2;
            
            float drip = 1.0 - smoothstep(0.0, dripLength, topFlow);
            drip *= 1.0 - smoothstep(0.0, dripWidth, abs(uv.x - dripX));
            drips += drip * 0.4;
          }
          
          paintShape += drips;
          
          // Enhanced color system with complex gradients
          vec3 baseColor = hsv2rgb(vec3(u_hue, u_saturation, u_brightness));
          
          // Add color variation based on audio with more complexity
          vec3 colorVariation1 = hsv2rgb(vec3(
            u_hue + u_melody * 0.15,
            u_saturation + u_vocal * 0.3,
            u_brightness + u_audioIntensity * 0.4
          ));
          
          vec3 colorVariation2 = hsv2rgb(vec3(
            u_hue + 0.1 + u_snare * 0.1,
            u_saturation + u_hihat * 0.2,
            u_brightness + u_kick * 0.3
          ));
          
          // Complex color mixing based on position and flow
          vec3 paintColor = mix(baseColor, colorVariation1, 0.4);
          paintColor = mix(paintColor, colorVariation2, 0.3);
          
          // Add enhanced metallic/glitter effect with multiple layers
          float glitter1 = fbm(uv * 30.0 + u_time * 0.8);
          float glitter2 = fbm(uv * 60.0 + u_time * 1.2);
          float glitter3 = fbm(uv * 120.0 + u_time * 1.8);
          
          if (glitter1 > 0.88) {
            paintColor += vec3(0.9, 0.95, 1.0) * u_highFreq * 0.7;
          }
          if (glitter2 > 0.92) {
            paintColor += vec3(1.0, 1.0, 1.0) * u_hihat * 0.5;
          }
          if (glitter3 > 0.95) {
            paintColor += vec3(0.8, 0.9, 1.0) * u_audioIntensity * 0.3;
          }
          
          // Enhanced glow effect with multiple layers
          float glow1 = paintShape * (0.6 + u_audioIntensity * 0.4);
          float glow2 = paintShape * paintShape * (0.3 + u_midFreq * 0.2);
          float glow3 = drips * (0.2 + u_highFreq * 0.1);
          
          paintColor += vec3(glow1 * 0.4) * baseColor;
          paintColor += vec3(glow2 * 0.3) * colorVariation1;
          paintColor += vec3(glow3 * 0.2) * colorVariation2;
          
          // Add inner luminosity effect
          float innerGlow = smoothstep(0.0, 0.3, paintShape);
          paintColor += vec3(innerGlow * 0.2) * vec3(0.8, 0.9, 1.0);
          
          // Final output with enhanced contrast and depth
          vec3 finalColor = paintColor * paintShape;
          float alpha = paintShape * (0.9 + u_audioIntensity * 0.1);
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    
    // Bottom paint flow (coming from bottom)
    this.bottomPaintMaterial = new THREE.ShaderMaterial({
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
        u_kick: { value: 0 },
        u_vocal: { value: 0 },
        u_melody: { value: 0 },
        u_hue: { value: 0 },
        u_saturation: { value: 0 },
        u_brightness: { value: 0 },
        u_beatPhase: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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
        uniform float u_kick;
        uniform float u_vocal;
        uniform float u_melody;
        uniform float u_hue;
        uniform float u_saturation;
        uniform float u_brightness;
        uniform float u_beatPhase;
        
        varying vec2 vUv;
        
        // Enhanced noise functions
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          
          for (int i = 0; i < 6; i++) {
            value += amplitude * noise(p * frequency);
            amplitude *= 0.5;
            frequency *= 2.0;
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
          
          // Bottom paint flow - starts from bottom edge with more complex patterns
          float bottomFlow = uv.y; // Distance from bottom
          
          // Enhanced flowing motion with multiple frequencies
          float flowSpeed1 = 0.2 + u_audioIntensity * 0.3;
          float flowSpeed2 = 0.4 + u_midFreq * 0.2;
          float flowOffset1 = sin(u_time * flowSpeed1 + uv.x * 4.0) * 0.15;
          float flowOffset2 = cos(u_time * flowSpeed2 + uv.x * 2.0) * 0.08;
          bottomFlow += flowOffset1 + flowOffset2;
          
          // Add complex organic paint texture with multiple layers
          float paintTexture1 = fbm(uv * 6.0 + u_time * 0.15);
          float paintTexture2 = fbm(uv * 12.0 + u_time * 0.25);
          float paintTexture3 = fbm(uv * 24.0 + u_time * 0.35);
          bottomFlow *= (0.5 + paintTexture1 * 0.3 + paintTexture2 * 0.15 + paintTexture3 * 0.05);
          
          // Enhanced audio reactive pulsing with multiple harmonics
          float pulse1 = sin(u_time * 1.5 + u_lowFreq * 10.0) * 0.25 + 0.75;
          float pulse2 = sin(u_time * 3.0 + u_midFreq * 8.0) * 0.15 + 0.85;
          float pulse3 = sin(u_time * 6.0 + u_highFreq * 6.0) * 0.1 + 0.9;
          bottomFlow *= pulse1 * pulse2 * pulse3;
          
          // Create more organic paint drop shape with multiple curves
          float paintShape = smoothstep(0.0, 0.4, bottomFlow);
          paintShape *= smoothstep(0.7, 0.0, bottomFlow); // Fade out at top
          
          // Add complex paint drips with varying patterns
          float drips = 0.0;
          for (int i = 0; i < 8; i++) {
            float dripX = 0.1 + float(i) * 0.11;
            float dripWidth = 0.03 + u_hihat * 0.04 + sin(u_time * 2.0 + float(i)) * 0.02;
            float dripLength = 0.5 + u_midFreq * 0.3 + u_bassDrum * 0.2;
            
            float drip = 1.0 - smoothstep(0.0, dripLength, bottomFlow);
            drip *= 1.0 - smoothstep(0.0, dripWidth, abs(uv.x - dripX));
            drips += drip * 0.4;
          }
          
          paintShape += drips;
          
          // Enhanced color system - different hue for bottom with complex gradients
          vec3 baseColor = hsv2rgb(vec3(u_hue + 0.4, u_saturation, u_brightness));
          
          // Add color variation based on audio with more complexity
          vec3 colorVariation1 = hsv2rgb(vec3(
            u_hue + 0.4 + u_melody * 0.15,
            u_saturation + u_vocal * 0.3,
            u_brightness + u_audioIntensity * 0.4
          ));
          
          vec3 colorVariation2 = hsv2rgb(vec3(
            u_hue + 0.5 + u_snare * 0.1,
            u_saturation + u_hihat * 0.2,
            u_brightness + u_kick * 0.3
          ));
          
          // Complex color mixing based on position and flow
          vec3 paintColor = mix(baseColor, colorVariation1, 0.4);
          paintColor = mix(paintColor, colorVariation2, 0.3);
          
          // Add enhanced metallic/glitter effect with multiple layers
          float glitter1 = fbm(uv * 30.0 + u_time * 0.8);
          float glitter2 = fbm(uv * 60.0 + u_time * 1.2);
          float glitter3 = fbm(uv * 120.0 + u_time * 1.8);
          
          if (glitter1 > 0.88) {
            paintColor += vec3(0.9, 0.95, 1.0) * u_highFreq * 0.7;
          }
          if (glitter2 > 0.92) {
            paintColor += vec3(1.0, 1.0, 1.0) * u_hihat * 0.5;
          }
          if (glitter3 > 0.95) {
            paintColor += vec3(0.8, 0.9, 1.0) * u_audioIntensity * 0.3;
          }
          
          // Enhanced glow effect with multiple layers
          float glow1 = paintShape * (0.6 + u_audioIntensity * 0.4);
          float glow2 = paintShape * paintShape * (0.3 + u_midFreq * 0.2);
          float glow3 = drips * (0.2 + u_highFreq * 0.1);
          
          paintColor += vec3(glow1 * 0.4) * baseColor;
          paintColor += vec3(glow2 * 0.3) * colorVariation1;
          paintColor += vec3(glow3 * 0.2) * colorVariation2;
          
          // Add inner luminosity effect
          float innerGlow = smoothstep(0.0, 0.3, paintShape);
          paintColor += vec3(innerGlow * 0.2) * vec3(0.8, 0.9, 1.0);
          
          // Final output with enhanced contrast and depth
          vec3 finalColor = paintColor * paintShape;
          float alpha = paintShape * (0.9 + u_audioIntensity * 0.1);
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    
    // Create full-screen quads
    const geometry = new THREE.PlaneGeometry(2, 2);
    
    this.topPaintMesh = new THREE.Mesh(geometry, this.topPaintMaterial);
    this.bottomPaintMesh = new THREE.Mesh(geometry, this.bottomPaintMaterial);
    
    this.scene.add(this.topPaintMesh);
    this.scene.add(this.bottomPaintMesh);
  }

  private setupGlitter(): void {
    this.glitterGeometry = new THREE.BufferGeometry();
    this.glitterParticles = new Float32Array(this.glitterCount * 3);
    
    // Initialize glitter positions
    for (let i = 0; i < this.glitterCount; i++) {
      this.glitterParticles[i * 3] = (Math.random() - 0.5) * 4; // x
      this.glitterParticles[i * 3 + 1] = (Math.random() - 0.5) * 4; // y
      this.glitterParticles[i * 3 + 2] = Math.random() * 2; // z (depth)
    }
    
    this.glitterGeometry.setAttribute('position', new THREE.BufferAttribute(this.glitterParticles, 3));
    
    this.glitterMaterial = new THREE.ShaderMaterial({
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
        uniform float u_highFreq;
        uniform float u_hihat;
        
        varying float vAlpha;
        varying float vSize;
        varying vec3 vColor;
        varying float vSparkle;
        
        void main() {
          vec3 pos = position;
          
          // Enhanced floating motion with multiple frequencies
          pos.y += sin(u_time * 1.2 + pos.x * 0.8) * 0.2;
          pos.x += cos(u_time * 0.8 + pos.y * 0.6) * 0.1;
          pos.z += sin(u_time * 1.0 + pos.x * 0.4) * 0.05;
          
          // Audio reactive movement with more dynamics
          pos += vec3(
            sin(u_time * 4.0) * u_highFreq * 0.4,
            cos(u_time * 3.0) * u_audioIntensity * 0.3,
            sin(u_time * 2.5) * u_hihat * 0.2
          );
          
          gl_Position = vec4(pos, 1.0);
          
          // Dynamic glitter size with more variation
          vSize = 1.5 + u_audioIntensity * 6.0 + u_highFreq * 4.0;
          gl_PointSize = vSize;
          
          // Enhanced alpha with depth and audio reactivity
          vAlpha = 0.7 + u_audioIntensity * 0.3 + u_highFreq * 0.2;
          
          // Color variation based on position and audio
          vColor = vec3(
            0.9 + sin(pos.x * 4.0) * 0.1,
            0.85 + cos(pos.y * 4.0) * 0.15,
            1.0 + sin(u_time * 2.0 + pos.z) * 0.1
          );
          
          // Sparkle intensity for fragment shader
          vSparkle = 0.8 + u_audioIntensity * 0.2 + u_highFreq * 0.3;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying float vSize;
        varying vec3 vColor;
        varying float vSparkle;
        
        void main() {
          float distance = length(gl_PointCoord - vec2(0.5));
          
          // Enhanced glitter shape with soft edges and inner glow
          float alpha = (1.0 - smoothstep(0.0, 0.5, distance)) * vAlpha;
          
          // Add multiple glow layers
          float innerGlow = 1.0 - smoothstep(0.0, 0.3, distance);
          float outerGlow = 1.0 - smoothstep(0.0, 0.7, distance);
          
          alpha += innerGlow * 0.5 * vSparkle;
          alpha += outerGlow * 0.2 * vSparkle;
          
          // Enhanced color with multiple glow effects
          vec3 color = vColor;
          
          // Inner bright core
          color += vec3(innerGlow * 0.8) * vec3(1.0, 1.0, 1.0);
          
          // Outer soft glow
          color += vec3(outerGlow * 0.3) * vec3(0.9, 0.95, 1.0);
          
          // Add sparkle effect
          float sparkle = sin(distance * 20.0) * 0.1 + 0.9;
          color *= sparkle;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    
    this.glitterSystem = new THREE.Points(this.glitterGeometry, this.glitterMaterial);
    this.scene.add(this.glitterSystem);
  }

  update(deltaTime: number, events: AudioEvent[], analysisFrame: AnalysisFrame): void {
    this.time += deltaTime;
    
    // Update audio properties
    this.audioIntensity = analysisFrame.rms;
    this.lowFreq = analysisFrame.low;
    this.midFreq = analysisFrame.mid;
    this.highFreq = analysisFrame.high;
    this.bassDrum = analysisFrame.bassDrum;
    this.snare = analysisFrame.snare;
    this.hihat = analysisFrame.hihat;
    this.kick = analysisFrame.kick;
    this.vocal = analysisFrame.vocal;
    this.melody = analysisFrame.melody;
    this.hue = analysisFrame.hue;
    this.saturation = analysisFrame.saturation;
    this.brightness = analysisFrame.brightness;
    this.beatPhase = analysisFrame.beatPhase;
    
    // Update top paint material uniforms
    this.topPaintMaterial.uniforms.u_time.value = this.time;
    this.topPaintMaterial.uniforms.u_audioIntensity.value = this.audioIntensity;
    this.topPaintMaterial.uniforms.u_lowFreq.value = this.lowFreq;
    this.topPaintMaterial.uniforms.u_midFreq.value = this.midFreq;
    this.topPaintMaterial.uniforms.u_highFreq.value = this.highFreq;
    this.topPaintMaterial.uniforms.u_bassDrum.value = this.bassDrum;
    this.topPaintMaterial.uniforms.u_snare.value = this.snare;
    this.topPaintMaterial.uniforms.u_hihat.value = this.hihat;
    this.topPaintMaterial.uniforms.u_kick.value = this.kick;
    this.topPaintMaterial.uniforms.u_vocal.value = this.vocal;
    this.topPaintMaterial.uniforms.u_melody.value = this.melody;
    this.topPaintMaterial.uniforms.u_hue.value = this.hue;
    this.topPaintMaterial.uniforms.u_saturation.value = this.saturation;
    this.topPaintMaterial.uniforms.u_brightness.value = this.brightness;
    this.topPaintMaterial.uniforms.u_beatPhase.value = this.beatPhase;
    
    // Update bottom paint material uniforms
    this.bottomPaintMaterial.uniforms.u_time.value = this.time;
    this.bottomPaintMaterial.uniforms.u_audioIntensity.value = this.audioIntensity;
    this.bottomPaintMaterial.uniforms.u_lowFreq.value = this.lowFreq;
    this.bottomPaintMaterial.uniforms.u_midFreq.value = this.midFreq;
    this.bottomPaintMaterial.uniforms.u_highFreq.value = this.highFreq;
    this.bottomPaintMaterial.uniforms.u_bassDrum.value = this.bassDrum;
    this.bottomPaintMaterial.uniforms.u_snare.value = this.snare;
    this.bottomPaintMaterial.uniforms.u_hihat.value = this.hihat;
    this.bottomPaintMaterial.uniforms.u_kick.value = this.kick;
    this.bottomPaintMaterial.uniforms.u_vocal.value = this.vocal;
    this.bottomPaintMaterial.uniforms.u_melody.value = this.melody;
    this.bottomPaintMaterial.uniforms.u_hue.value = this.hue;
    this.bottomPaintMaterial.uniforms.u_saturation.value = this.saturation;
    this.bottomPaintMaterial.uniforms.u_brightness.value = this.brightness;
    this.bottomPaintMaterial.uniforms.u_beatPhase.value = this.beatPhase;
    
    // Update glitter material uniforms
    this.glitterMaterial.uniforms.u_time.value = this.time;
    this.glitterMaterial.uniforms.u_audioIntensity.value = this.audioIntensity;
    this.glitterMaterial.uniforms.u_highFreq.value = this.highFreq;
    this.glitterMaterial.uniforms.u_hihat.value = this.hihat;
    this.glitterMaterial.uniforms.u_hue.value = this.hue;
  }

  render(): void {
    try {
      if (this.scene && this.camera && this.renderer) {
        this.renderer.render(this.scene, this.camera);
      } else {
        console.error('PaintFlowRenderer: Missing scene, camera, or renderer', {
          scene: !!this.scene,
          camera: !!this.camera,
          renderer: !!this.renderer
        });
      }
    } catch (error) {
      console.error('PaintFlowRenderer render error:', error);
    }
  }

  dispose(): void {
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.topPaintMaterial) {
      this.topPaintMaterial.dispose();
    }
    if (this.bottomPaintMaterial) {
      this.bottomPaintMaterial.dispose();
    }
    if (this.glitterMaterial) {
      this.glitterMaterial.dispose();
    }
    if (this.glitterGeometry) {
      this.glitterGeometry.dispose();
    }
  }
}
