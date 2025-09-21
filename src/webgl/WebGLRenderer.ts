import * as THREE from 'three';

export class WebGLRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;
  private uniforms: Record<string, THREE.IUniform>;
  private material: THREE.ShaderMaterial;
  private geometry: THREE.PlaneGeometry;
  private mesh: THREE.Mesh;
  private targets: Map<string, any> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 0); // Transparent background
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 1;
    
    this.clock = new THREE.Clock();
    
    this.uniforms = this.createUniforms();
    this.material = this.createMaterial();
    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    
    this.scene.add(this.mesh);
    
    // Set initial resolution
    this.uniforms.u_resolution.value.set(canvas.clientWidth, canvas.clientHeight);
    
    this.setupResizeHandler();
  }

  private createUniforms(): Record<string, THREE.IUniform> {
    return {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2() },
      u_mouse: { value: new THREE.Vector2() },
      
      // Motion uniforms
      u_position: { value: new THREE.Vector2(0, 0) },
      u_posX: { value: 0 },
      u_posY: { value: 0 },
      u_rotation: { value: 0 },
      u_scale: { value: 1 },
      u_tile: { value: 1 },
      u_shake: { value: 0 },
      
      // Shape uniforms
      u_waveform: { value: 0 },
      u_vertices: { value: 3 },
      u_pwm: { value: 0.5 },
      u_noise: { value: 0 },
      u_domainWarp: { value: 0 },
      
      // Color uniforms
      u_hue: { value: 0 },
      u_saturation: { value: 1 },
      u_value: { value: 1 },
      u_gradientPos: { value: 0 },
      u_bloom: { value: 0 },
      u_temperature: { value: 0 },
      
      // FX uniforms
      u_strobe: { value: 0 },
      u_blur: { value: 0 },
      u_edge: { value: 0 },
      u_glitch: { value: 0 },
      u_chromaticAberration: { value: 0 },
      
      // Material uniforms
      u_fresnel: { value: 0 },
      u_roughness: { value: 0.5 },
      u_metallic: { value: 0 },
      
      // Mask uniforms
      u_maskOpen: { value: 1 },
      u_maskFeather: { value: 0 },
      u_maskRotation: { value: 0 }
    };
  }

  private createMaterial(): THREE.ShaderMaterial {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      
      // Motion uniforms
      uniform vec2 u_position;
      uniform float u_posX;
      uniform float u_posY;
      uniform float u_rotation;
      uniform float u_scale;
      uniform float u_tile;
      uniform float u_shake;
      
      // Shape uniforms
      uniform float u_waveform;
      uniform float u_vertices;
      uniform float u_pwm;
      uniform float u_noise;
      uniform float u_domainWarp;
      
      // Color uniforms
      uniform float u_hue;
      uniform float u_saturation;
      uniform float u_value;
      uniform float u_gradientPos;
      uniform float u_bloom;
      uniform float u_temperature;
      
      // FX uniforms
      uniform float u_strobe;
      uniform float u_blur;
      uniform float u_edge;
      uniform float u_glitch;
      uniform float u_chromaticAberration;
      
      // Material uniforms
      uniform float u_fresnel;
      uniform float u_roughness;
      uniform float u_metallic;
      
      // Mask uniforms
      uniform float u_maskOpen;
      uniform float u_maskFeather;
      uniform float u_maskRotation;
      
      varying vec2 vUv;
      
      // Noise function
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }
      
      // HSV to RGB conversion
      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }
      
      // Waveform functions
      float sineWave(vec2 uv, float freq) {
        return sin(uv.x * freq * 6.28318) * 0.5 + 0.5;
      }
      
      float sawWave(vec2 uv, float freq) {
        return fract(uv.x * freq);
      }
      
      float triangleWave(vec2 uv, float freq) {
        return abs(fract(uv.x * freq) - 0.5) * 2.0;
      }
      
      float squareWave(vec2 uv, float freq) {
        return step(0.5, fract(uv.x * freq));
      }
      
      float pulseWave(vec2 uv, float freq, float pwm) {
        return step(pwm, fract(uv.x * freq));
      }
      
      float noiseWave(vec2 uv, float freq) {
        return random(uv * freq);
      }
      
      // Create geometric shapes
      float circle(vec2 uv, vec2 center, float radius) {
        return 1.0 - smoothstep(radius - 0.02, radius + 0.02, length(uv - center));
      }
      
      float triangle(vec2 uv, vec2 center) {
        vec2 p = uv - center;
        float d = max(abs(p.x) * 0.866 + p.y * 0.5, -p.y);
        return 1.0 - smoothstep(0.3, 0.32, d);
      }
      
      float square(vec2 uv, vec2 center) {
        vec2 p = abs(uv - center);
        return 1.0 - smoothstep(0.3, 0.32, max(p.x, p.y));
      }
      
      float pentagon(vec2 uv, vec2 center) {
        vec2 p = uv - center;
        float angle = atan(p.y, p.x);
        float radius = length(p);
        float polygon = cos(floor(0.5 + angle / 6.28318 * 5.0) * 6.28318 / 5.0 - angle);
        return 1.0 - smoothstep(0.3, 0.32, radius / polygon);
      }
      
      void main() {
        vec2 uv = vUv;
        
        // Apply position offset
        uv += u_position * 0.5;
        uv += vec2(u_posX, u_posY) * 0.5;
        
        // Apply rotation
        float angle = u_rotation * 6.28318;
        vec2 center = vec2(0.5);
        uv = center + (uv - center) * mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
        
        // Apply scale
        uv = center + (uv - center) / u_scale;
        
        // Apply tiling
        uv = fract(uv * u_tile);
        
        // Apply shake
        uv += vec2(random(vec2(u_time)) - 0.5, random(vec2(u_time + 1.0)) - 0.5) * u_shake * 0.1;
        
        // Apply domain warp
        if (u_domainWarp > 0.0) {
          uv += vec2(sin(uv.y * 10.0), cos(uv.x * 10.0)) * u_domainWarp * 0.05;
        }
        
        // Generate waveform based on u_waveform value
        float wave = 0.0;
        if (u_waveform < 0.2) {
          wave = sineWave(uv, 2.0);
        } else if (u_waveform < 0.4) {
          wave = sawWave(uv, 2.0);
        } else if (u_waveform < 0.6) {
          wave = triangleWave(uv, 2.0);
        } else if (u_waveform < 0.8) {
          wave = squareWave(uv, 2.0);
        } else if (u_waveform < 1.0) {
          wave = pulseWave(uv, 2.0, u_pwm);
        } else {
          wave = noiseWave(uv, 2.0);
        }
        
        // Apply noise
        if (u_noise > 0.0) {
          wave += (random(uv + u_time) - 0.5) * u_noise;
        }
        
        // Create shape based on vertices
        float shape = 0.0;
        
        if (u_vertices < 3.5) {
          // Circle
          shape = circle(uv, center, 0.3);
        } else if (u_vertices < 4.5) {
          // Triangle
          shape = triangle(uv, center);
        } else if (u_vertices < 5.5) {
          // Square
          shape = square(uv, center);
        } else {
          // Pentagon
          shape = pentagon(uv, center);
        }
        
        // Combine wave and shape
        float finalValue = wave * shape;
        
        // Apply mask
        float mask = u_maskOpen;
        if (u_maskFeather > 0.0) {
          mask = smoothstep(0.0, u_maskFeather, u_maskOpen);
        }
        finalValue *= mask;
        
        // Apply strobe
        if (u_strobe > 0.0) {
          finalValue *= step(0.5, fract(u_time * u_strobe * 10.0));
        }
        
        // Create color
        vec3 color = hsv2rgb(vec3(u_hue, u_saturation, u_value));
        
        // Apply bloom
        if (u_bloom > 0.0) {
          color += vec3(finalValue) * u_bloom * 2.0;
        }
        
        // Apply temperature
        if (u_temperature > 0.0) {
          color.r += u_temperature * 0.5;
          color.b -= u_temperature * 0.5;
        }
        
        // Apply glitch
        if (u_glitch > 0.0) {
          float glitchAmount = random(vec2(u_time)) * u_glitch;
          color = mix(color, vec3(random(uv + u_time)), glitchAmount);
        }
        
        // Apply edge detection
        if (u_edge > 0.0) {
          float edge = abs(finalValue - 0.5) * 2.0;
          color = mix(color, vec3(edge), u_edge);
        }
        
        gl_FragColor = vec4(color, finalValue);
      }
    `;

    return new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
  }

  private setupResizeHandler(): void {
    const handleResize = () => {
      const canvas = this.renderer.domElement;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      
      this.renderer.setSize(width, height);
      this.uniforms.u_resolution.value.set(width, height);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
  }

  updateTargets(targets: any[]): void {
    targets.forEach(target => {
      this.targets.set(target.id, target);
      
      // Special handling for position targets
      if (target.id === 'posX' || target.id === 'posY') {
        const posX = this.targets.get('posX')?.value || 0;
        const posY = this.targets.get('posY')?.value || 0;
        this.uniforms.u_position.value.set(posX, posY);
        this.uniforms.u_posX.value = posX;
        this.uniforms.u_posY.value = posY;
        return;
      }
      
      // Update corresponding uniform
      const uniform = this.uniforms[`u_${target.id}`];
      if (uniform) {
        uniform.value = target.value;
      } else {
        console.warn(`No uniform found for target: ${target.id}`);
      }
    });
  }

  render(): void {
    this.uniforms.u_time.value = this.clock.getElapsedTime();
    
    // Set default values to ensure something is always visible
    this.uniforms.u_hue.value = 0.5;
    this.uniforms.u_saturation.value = 1.0;
    this.uniforms.u_value.value = 0.8;
    this.uniforms.u_scale.value = 1.0;
    this.uniforms.u_vertices.value = 3;
    this.uniforms.u_waveform.value = 0;
    
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.renderer.dispose();
    this.geometry.dispose();
    this.material.dispose();
  }

  getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  getTargetsMap(): Map<string, any> {
    return this.targets;
  }
}
