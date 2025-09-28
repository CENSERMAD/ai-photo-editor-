import React from 'react';
import { EditorState } from '../App';
import Slider from './Slider';
import { RotateCwIcon, RotateCcwIcon, FlipHorizontalIcon } from './icons';

interface AdjustmentPanelProps {
    editorState: EditorState;
    onStateChange: (newState: EditorState, commit: boolean) => void;
    disabled?: boolean;
}

const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({ editorState, onStateChange, disabled }) => {

    const handleAdjustmentChange = (adjustment: string, value: number, commit: boolean) => {
        onStateChange({
            ...editorState,
            adjustments: {
                ...editorState.adjustments,
                [adjustment]: value,
            }
        }, commit);
    };
    
    const handleRotate = (direction: 'cw' | 'ccw') => {
        const currentRotation = editorState.transform.rotation;
        const amount = direction === 'cw' ? 90 : -90;
        const newRotation = (currentRotation + amount + 360) % 360;
        onStateChange({
            ...editorState,
            transform: {
                ...editorState.transform,
                rotation: newRotation
            }
        }, true);
    };

    const handleFlip = () => {
        onStateChange({
            ...editorState,
            transform: {
                ...editorState.transform,
                flipH: !editorState.transform.flipH
            }
        }, true);
    };

    const resetAdjustments = () => {
        onStateChange({
            ...editorState,
            adjustments: { brightness: 100, contrast: 100, saturate: 100, hue: 0, blur: 0 }
        }, true);
    };


    const adjustments = editorState.adjustments;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-cyan-300">Adjustments</h3>
                <button
                    onClick={resetAdjustments}
                    disabled={disabled}
                    className="text-xs bg-gray-600 hover:bg-cyan-700 text-white font-semibold py-1 px-3 rounded transition-colors"
                >
                    Reset Adjustments
                </button>
            </div>
            <Slider label="Brightness" value={adjustments.brightness} min={0} max={200} onChange={(v, c) => handleAdjustmentChange('brightness', v, c)} disabled={disabled} />
            <Slider label="Contrast" value={adjustments.contrast} min={0} max={200} onChange={(v, c) => handleAdjustmentChange('contrast', v, c)} disabled={disabled} />
            <Slider label="Saturation" value={adjustments.saturate} min={0} max={200} onChange={(v, c) => handleAdjustmentChange('saturate', v, c)} disabled={disabled} />
            <Slider label="Hue" value={adjustments.hue} min={-180} max={180} onChange={(v, c) => handleAdjustmentChange('hue', v, c)} disabled={disabled} />
            <Slider label="Blur" value={adjustments.blur} min={0} max={20} onChange={(v, c) => handleAdjustmentChange('blur', v, c)} disabled={disabled} />

            <div className="pt-2">
                <h3 className="text-lg font-bold text-cyan-300 mb-2">Transform</h3>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleRotate('ccw')} disabled={disabled} className="p-3 rounded-lg bg-gray-700 hover:bg-cyan-600 disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors flex items-center justify-center" aria-label="Rotate counter-clockwise">
                        <RotateCcwIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={() => handleRotate('cw')} disabled={disabled} className="p-3 rounded-lg bg-gray-700 hover:bg-cyan-600 disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors flex items-center justify-center" aria-label="Rotate clockwise">
                        <RotateCwIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={handleFlip} disabled={disabled} className="p-3 rounded-lg bg-gray-700 hover:bg-cyan-600 disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors flex items-center justify-center" aria-label="Flip horizontal">
                        <FlipHorizontalIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdjustmentPanel;
