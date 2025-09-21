import React from 'react';

interface CodeOverlayProps {
  appState: any;
  audioAnalysis: any;
}

export const CodeOverlay: React.FC<CodeOverlayProps> = ({ appState, audioAnalysis }) => {
  if (appState.codeOverlay === 'off') {
    return null;
  }

  const isMinimal = appState.codeOverlay === 'minimal';

  return (
    <div className={`code-overlay ${isMinimal ? 'minimal' : 'full'}`}>
      {isMinimal ? (
        <div className="minimal-overlay">
          <div className="audio-indicator">
            <div className="level-bar">
              <div 
                className="level-fill"
                style={{ 
                  width: `${(audioAnalysis?.rms || 0) * 100}%`,
                  backgroundColor: audioAnalysis?.onset ? '#FF6EC7' : '#7DF9FF'
                }}
              />
            </div>
            <div className="mode-indicator">
              {appState.mode.toUpperCase()}
            </div>
          </div>
        </div>
      ) : (
        <div className="full-overlay">
          <div className="code-panel">
            <div className="panel-header">
              <h3>HikariWeave Engine</h3>
              <div className="status-indicators">
                <span className={`status ${appState.isPlaying ? 'active' : 'inactive'}`}>
                  {appState.isPlaying ? '●' : '○'}
                </span>
                <span className="mode">{appState.mode}</span>
              </div>
            </div>
            
            <div className="audio-data">
              <h4>Audio Analysis</h4>
              <div className="data-grid">
                <div className="data-item">
                  <label>RMS</label>
                  <div className="value">{audioAnalysis?.rms?.toFixed(3) || '0.000'}</div>
                </div>
                <div className="data-item">
                  <label>Peak</label>
                  <div className="value">{audioAnalysis?.peak?.toFixed(3) || '0.000'}</div>
                </div>
                <div className="data-item">
                  <label>Low</label>
                  <div className="value">{audioAnalysis?.low?.toFixed(3) || '0.000'}</div>
                </div>
                <div className="data-item">
                  <label>Mid</label>
                  <div className="value">{audioAnalysis?.mid?.toFixed(3) || '0.000'}</div>
                </div>
                <div className="data-item">
                  <label>High</label>
                  <div className="value">{audioAnalysis?.high?.toFixed(3) || '0.000'}</div>
                </div>
                <div className="data-item">
                  <label>BPM</label>
                  <div className="value">{Math.round(audioAnalysis?.bpm || 120)}</div>
                </div>
                <div className="data-item">
                  <label>Onset</label>
                  <div className={`value ${audioAnalysis?.onset ? 'triggered' : ''}`}>
                    {audioAnalysis?.onset ? 'TRIG' : '---'}
                  </div>
                </div>
                <div className="data-item">
                  <label>Centroid</label>
                  <div className="value">{audioAnalysis?.spectralCentroid?.toFixed(1) || '0.0'}</div>
                </div>
              </div>
            </div>
            
            <div className="preset-info">
              <h4>Active Preset</h4>
              <div className="preset-details">
                <div className="preset-name">{appState.activePreset?.name || 'None'}</div>
                <div className="preset-type">{appState.activePreset?.type || '---'}</div>
              </div>
            </div>
            
            <div className="macro-controls">
              <h4>Macro Controls</h4>
              <div className="macro-grid">
                <div className="macro-item">
                  <label>Energy</label>
                  <div className="macro-value">{appState.macroKnobs.energy.toFixed(2)}</div>
                </div>
                <div className="macro-item">
                  <label>Density</label>
                  <div className="macro-value">{appState.macroKnobs.density.toFixed(2)}</div>
                </div>
                <div className="macro-item">
                  <label>Purity</label>
                  <div className="macro-value">{appState.macroKnobs.purity.toFixed(2)}</div>
                </div>
                <div className="macro-item">
                  <label>Glow</label>
                  <div className="macro-value">{appState.macroKnobs.glow.toFixed(2)}</div>
                </div>
              </div>
            </div>
            
            <div className="system-info">
              <h4>System</h4>
              <div className="system-data">
                <div className="system-item">
                  <label>FPS</label>
                  <div className="value">60</div>
                </div>
                <div className="system-item">
                  <label>Latency</label>
                  <div className="value">&lt;80ms</div>
                </div>
                <div className="system-item">
                  <label>Resolution</label>
                  <div className="value">1080p</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
