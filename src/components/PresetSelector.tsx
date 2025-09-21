import React from 'react';
import { LivePresets } from '../audio/LivePresets';

interface PresetSelectorProps {
  activePreset: any | null;
  onPresetSelect: (preset: any) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({ 
  activePreset, 
  onPresetSelect 
}) => {
  const presets = LivePresets.getAllPresets();

  return (
    <div className="preset-selector">
      <h3>Live Presets</h3>
      <div className="preset-grid">
        {presets.map(preset => (
          <button
            key={preset.id}
            className={`preset-button ${activePreset?.id === preset.id ? 'active' : ''}`}
            onClick={() => onPresetSelect(preset)}
          >
            <div className="preset-icon">
              {preset.id === 'beam' && '🔺'}
              {preset.id === 'wave' && '⬜'}
              {preset.id === 'particles' && '⭐'}
            </div>
            <div className="preset-name">{preset.name}</div>
            <div className="preset-description">
              {preset.id === 'beam' && '低域→スケール&Bloom、高域→ストロボ'}
              {preset.id === 'wave' && '低域→振幅、中域→ドメインワープ、高域→モアレ'}
              {preset.id === 'particles' && '低域→密度、中域→筆圧、高域→スパーク'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
