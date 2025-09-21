import React, { useState, useEffect } from 'react';
import { StudioView } from './components/StudioView';
import './App.css';

const initialAppState = {
  mode: 'live',
  isPlaying: false,
  isFullscreen: false,
  codeOverlay: 'off',
  background: {
    type: 'black'
  },
  color: {
    palette: 'neon',
    hue: 0,
    saturation: 1,
    value: 1,
    bloom: 0,
    temperature: 0
  },
  activePreset: null,
  macroKnobs: {
    energy: 0.5,
    density: 0.5,
    purity: 0.5,
    glow: 0.5
  },
  scenes: [],
  activeScene: 0
};

function App() {
  const [appState, setAppState] = useState(initialAppState);

  const handleStateChange = (newState: any) => {
    setAppState(prev => ({ ...prev, ...newState }));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          handleStateChange({ 
            isPlaying: !appState.isPlaying 
          });
          break;
        case 'KeyF':
          event.preventDefault();
          handleStateChange({ 
            isFullscreen: !appState.isFullscreen 
          });
          break;
        case 'KeyC':
          event.preventDefault();
          const nextOverlay = appState.codeOverlay === 'off' ? 'minimal' : 
                             appState.codeOverlay === 'minimal' ? 'full' : 'off';
          handleStateChange({ codeOverlay: nextOverlay });
          break;
        case 'Digit1':
          handleStateChange({ mode: 'live' });
          break;
        case 'Digit2':
          handleStateChange({ mode: 'sculpt' });
          break;
        case 'Digit3':
          handleStateChange({ mode: 'mv' });
          break;
        case 'Digit4':
          handleStateChange({ mode: 'mapping' });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [appState.isPlaying, appState.isFullscreen, appState.codeOverlay]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>HikariWeave — Video Synth Studio</h1>
        <p>音で光を織る、誰でも演奏できる映像。</p>
      </header>
      
      <main className="app-main">
        <StudioView 
          appState={appState} 
          onStateChange={handleStateChange} 
        />
      </main>
      
      <footer className="app-footer">
        <div className="shortcuts">
          <span>Space: 再生/停止</span>
          <span>F: フルスクリーン</span>
          <span>C: コード表示切替</span>
          <span>1-4: モード切替</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
