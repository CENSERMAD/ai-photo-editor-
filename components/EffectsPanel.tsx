import React from 'react';
import { EditorState } from '../App';
import Slider from './Slider';

interface EffectsPanelProps {
    editorState: EditorState;
    onStateChange: (newState: EditorState, commit: boolean) => void;
    disabled?: boolean;
}

type Preset = 'none' | 'sepia' | 'grayscale' | 'invert';

const presets: { id: Preset, name: string }[] = [
    { id: 'none', name: 'None' },
    { id: 'sepia', name: 'Sepia' },
    { id: 'grayscale', name: 'Grayscale' },
    { id: 'invert', name: 'Invert' },
];

const EffectsPanel: React.FC<EffectsPanelProps> = ({ editorState, onStateChange, disabled }) => {
    
    const { effects } = editorState;

    const handleEffectChange = (effect: string, value: number, commit: boolean) => {
        onStateChange({
            ...editorState,
            effects: { ...effects, [effect]: value }
        }, commit);
    };
    
    const handlePresetChange = (preset: Preset) => {
        onStateChange({
            ...editorState,
            effects: { ...effects, preset }
        }, true);
    };

    const resetEffects = () => {
        onStateChange({
            ...editorState,
            effects: { preset: 'none', vignette: 0, noise: 0 }
        }, true);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-cyan-300">Effects & Filters</h3>
                <button
                    onClick={resetEffects}
                    disabled={disabled}
                    className="text-xs bg-gray-600 hover:bg-cyan-700 text-white font-semibold py-1 px-3 rounded transition-colors"
                >
                    Reset Effects
                </button>
            </div>

            <div>
                <p className="text-sm font-medium text-gray-300 mb-2">Preset Filters</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {presets.map(p => (
                        <button 
                            key={p.id}
                            onClick={() => handlePresetChange(p.id)}
                            disabled={disabled}
                            className={`py-2 px-2 text-sm font-semibold rounded-md transition-colors duration-200 ${effects.preset === p.id ? 'bg-cyan-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            </div>

            <Slider label="Vignette" value={effects.vignette} min={0} max={100} onChange={(v, c) => handleEffectChange('vignette', v, c)} disabled={disabled} />
            <Slider label="Noise" value={effects.noise} min={0} max={100} onChange={(v, c) => handleEffectChange('noise', v, c)} disabled={disabled} />
        </div>
    );
};

export default EffectsPanel;