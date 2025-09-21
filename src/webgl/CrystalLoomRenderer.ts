import * as THREE from 'three';
import type { AudioEvent, AnalysisFrame } from '../audio/AudioEngine';

export class CrystalLoomRenderer {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  
  // Instanced mesh for the blocks
  private instancedMesh: THREE.InstancedMesh;
  private dummy = new THREE.Object3D();
  private blockCount = 150; // Number of blocks
  
  // Vertical black bars
  private barGeometry: THREE.BoxGeometry;
  private barMaterial: THREE.MeshBasicMaterial;
  private bars: THREE.Mesh[] = [];
  private barCount = 7;
  
  // Block colors (primary colors)
  private colors = [
    new THREE.Color(0xff0000), // Red
    new THREE.Color(0xffff00), // Yellow
    new THREE.Color(0x0000ff), // Blue
    new THREE.Color(0x00ff00), // Green (additional)
    new THREE.Color(0xff00ff), // Magenta (additional)
    new THREE.Color(0x00ffff)  // Cyan (additional)
  ];
  
  // Audio reactive parameters
  private audioEnergy = 0;
  private lowEnergy = 0;
  private midEnergy = 0;
  private highEnergy = 0;
  private beatPhase = 0;
  private time = 0;
  
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
  
  // Grid system
  private gridSize = 8;
  private gridSpacing = 60;
  private blockPositions: THREE.Vector3[] = [];
  private blockColors: THREE.Color[] = [];
  private blockScales: number[] = [];
  private blockRotations: number[] = [];
  
  // Event-driven block generation
  private eventHistory: AudioEvent[] = [];
  private maxEventHistory = 50;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupRenderer();
    this.setupScene();
    this.setupBars();
    this.setupBlocks();
    this.initializeGrid();
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
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
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
    
    // Isometric camera setup
    this.camera = new THREE.OrthographicCamera(
      -this.canvas.clientWidth / 2,
      this.canvas.clientWidth / 2,
      this.canvas.clientHeight / 2,
      -this.canvas.clientHeight / 2,
      1,
      1000
    );
    
    // Isometric view angle
    this.camera.position.set(300, 300, 300);
    this.camera.lookAt(0, 0, 0);
    
    // Add subtle lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
  }

  private setupBars(): void {
    this.barGeometry = new THREE.BoxGeometry(8, 400, 8);
    this.barMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    for (let i = 0; i < this.barCount; i++) {
      const bar = new THREE.Mesh(this.barGeometry, this.barMaterial);
      const x = (i - (this.barCount - 1) / 2) * 100;
      const z = (i - (this.barCount - 1) / 2) * 30;
      bar.position.set(x, 0, z);
      bar.castShadow = true;
      this.scene.add(bar);
      this.bars.push(bar);
    }
  }

  private setupBlocks(): void {
    const blockGeometry = new THREE.BoxGeometry(40, 15, 15);
    const blockMaterial = new THREE.MeshLambertMaterial();
    
    this.instancedMesh = new THREE.InstancedMesh(blockGeometry, blockMaterial, this.blockCount);
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;
    this.scene.add(this.instancedMesh);
  }

  private initializeGrid(): void {
    // Initialize block positions on a 3D grid
    for (let i = 0; i < this.blockCount; i++) {
      const x = (Math.random() - 0.5) * 500;
      const y = (Math.random() - 0.5) * 300;
      const z = (Math.random() - 0.5) * 150;
      
      this.blockPositions.push(new THREE.Vector3(x, y, z));
      this.blockColors.push(this.colors[Math.floor(Math.random() * this.colors.length)]);
      this.blockScales.push(1.0);
      this.blockRotations.push(0);
    }
    
    this.updateInstancedMesh();
  }

  private updateInstancedMesh(): void {
    for (let i = 0; i < this.blockCount; i++) {
      this.dummy.position.copy(this.blockPositions[i]);
      this.dummy.rotation.set(0, this.blockRotations[i], 0);
      this.dummy.scale.setScalar(this.blockScales[i]);
      this.dummy.updateMatrix();
      
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
      this.instancedMesh.setColorAt(i, this.blockColors[i]);
    }
    
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  private generateNewBlock(event: AudioEvent): void {
    // Find a random position near the bars
    const barIndex = Math.floor(Math.random() * this.bars.length);
    const bar = this.bars[barIndex];
    
    const x = bar.position.x + (Math.random() - 0.5) * 80;
    const y = (Math.random() - 0.5) * 200;
    const z = bar.position.z + (Math.random() - 0.5) * 40;
    
    // Choose color based on frequency band
    let colorIndex = 0;
    switch (event.band) {
      case 'low':
        colorIndex = 0; // Red
        break;
      case 'mid':
        colorIndex = 1; // Yellow
        break;
      case 'high':
        colorIndex = 2; // Blue
        break;
      default:
        colorIndex = Math.floor(Math.random() * this.colors.length);
    }
    
    // Find an available slot or replace an existing block
    const slotIndex = Math.floor(Math.random() * this.blockCount);
    
    this.blockPositions[slotIndex].set(x, y, z);
    this.blockColors[slotIndex] = this.colors[colorIndex].clone();
    this.blockScales[slotIndex] = 0.5 + event.energy * 1.5;
    this.blockRotations[slotIndex] = Math.random() * Math.PI * 2;
  }

  private updateMusicalBlockMovement(): void {
    for (let i = 0; i < this.blockCount; i++) {
      const position = this.blockPositions[i];
      const scale = this.blockScales[i];
      const rotation = this.blockRotations[i];
      
      // Enhanced floating movement with more dynamic patterns
      position.y += Math.sin(this.time * 0.8 + i * 0.2) * 0.8;
      position.x += Math.cos(this.time * 0.6 + i * 0.1) * 0.5;
      position.z += Math.sin(this.time * 0.7 + i * 0.15) * 0.3;
      
      // Musical element reactive movement - more dramatic
      // バスドラム = 垂直方向の強い動き
      position.y += Math.sin(this.time * 3.0 + i * 0.3) * this.bassDrum * 25;
      
      // スネア = 水平方向の動き
      position.x += Math.cos(this.time * 2.5 + i * 0.2) * this.snare * 20;
      
      // ハイハット = 細かい振動
      position.z += Math.sin(this.time * 12.0 + i * 0.15) * this.hihat * 12;
      
      // キック = 全体のスケール変化
      const kickScale = 1.0 + this.kick * 1.2;
      
      // ボーカル = 回転
      this.blockRotations[i] = rotation + this.vocal * 0.4;
      
      // メロディー = 色相変化とスケール
      if (this.melody > 0.1) {
        this.blockColors[i].setHSL(this.hue, this.saturation, this.brightness);
        this.blockScales[i] = scale * (1.0 + this.melody * 0.5);
      }
      
      // Beat-synchronized rotation - more dynamic
      this.blockRotations[i] += this.beatPhase * 0.2;
      
      // Scale pulsing based on musical elements - more dramatic
      this.blockScales[i] = Math.max(0.2, scale * kickScale + Math.sin(this.time * 4.0 + i * 0.4) * this.audioEnergy * 0.8);
      
      // Keep blocks within bounds
      position.x = Math.max(-300, Math.min(300, position.x));
      position.y = Math.max(-200, Math.min(200, position.y));
      position.z = Math.max(-100, Math.min(100, position.z));
    }
  }

  private updateBarMovement(): void {
    this.bars.forEach((bar, index) => {
      // Subtle swaying motion
      bar.position.y = Math.sin(this.time * 0.3 + index * 0.5) * this.lowEnergy * 20;
      
      // Slight rotation
      bar.rotation.z = Math.sin(this.time * 0.2 + index * 0.3) * this.midEnergy * 0.1;
    });
  }

  update(deltaTime: number, events: AudioEvent[], analysisFrame: AnalysisFrame): void {
    this.time += deltaTime;
    
    // Update audio reactive parameters
    if (analysisFrame) {
      this.audioEnergy = analysisFrame.rms;
      this.lowEnergy = analysisFrame.low;
      this.midEnergy = analysisFrame.mid;
      this.highEnergy = analysisFrame.high;
      this.beatPhase = analysisFrame.beatPhase;
      
      // Update musical elements
      this.bassDrum = analysisFrame.bassDrum;
      this.snare = analysisFrame.snare;
      this.hihat = analysisFrame.hihat;
      this.kick = analysisFrame.kick;
      this.vocal = analysisFrame.vocal;
      this.melody = analysisFrame.melody;
      
      // Update color control
      this.hue = analysisFrame.hue;
      this.saturation = analysisFrame.saturation;
      this.brightness = analysisFrame.brightness;
    }
    
    // Process new events
    for (const event of events) {
      this.eventHistory.push(event);
      this.generateNewBlock(event);
      
      // Keep event history manageable
      if (this.eventHistory.length > this.maxEventHistory) {
        this.eventHistory.shift();
      }
    }
    
    // Update block movements based on musical elements
    this.updateMusicalBlockMovement();
    
    // Update bar movements
    this.updateBarMovement();
    
    // Update instanced mesh
    this.updateInstancedMesh();
    
    // Gradual color transitions based on event history
    this.updateColorTransitions();
  }

  private updateColorTransitions(): void {
    // Gradually shift colors based on recent events
    for (let i = 0; i < this.blockCount; i++) {
      const currentColor = this.blockColors[i];
      
      // Find dominant color from recent events
      let targetColor = currentColor;
      if (this.eventHistory.length > 0) {
        const recentEvent = this.eventHistory[this.eventHistory.length - 1];
        let colorIndex = 0;
        
        switch (recentEvent.band) {
          case 'low':
            colorIndex = 0; // Red
            break;
          case 'mid':
            colorIndex = 1; // Yellow
            break;
          case 'high':
            colorIndex = 2; // Blue
            break;
          default:
            colorIndex = Math.floor(Math.random() * this.colors.length);
        }
        
        targetColor = this.colors[colorIndex];
      }
      
      // Smooth color transition
      currentColor.lerp(targetColor, 0.02);
    }
  }

  render(): void {
    try {
      if (this.scene && this.camera && this.renderer) {
        this.renderer.render(this.scene, this.camera);
      } else {
        console.error('CrystalLoomRenderer: Missing scene, camera, or renderer', {
          scene: !!this.scene,
          camera: !!this.camera,
          renderer: !!this.renderer
        });
      }
    } catch (error) {
      console.error('CrystalLoomRenderer render error:', error);
    }
  }

  dispose(): void {
    this.renderer.dispose();
    this.barGeometry.dispose();
    this.barMaterial.dispose();
    this.instancedMesh.geometry.dispose();
    (this.instancedMesh.material as THREE.Material).dispose();
  }
}
