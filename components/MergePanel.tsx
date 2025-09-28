import React, { useRef } from 'react';
import { ImageData, OverlayConfig, MergeConfig } from '../App';
import { UploadIcon, MoveIcon, BrushIcon, EraserIcon } from './icons';
import Slider from './Slider';

interface MergePanelProps {
    overlayImage: ImageData | null;
    onOverlayUpload: (file: File) => void;
    overlayConfig: OverlayConfig;
    onOverlayConfigChange: (config: OverlayConfig) => void;
    mergeConfig: MergeConfig;
    onMergeConfigChange: (config: MergeConfig) => void;
    onCommit: () => void;
    disabled?: boolean;
}

const ToolButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${isActive ? 'bg-cyan-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`} aria-pressed={isActive}>
        {icon}
        <span className="text-xs mt-1">{label}</span>
    </button>
);

const MergePanel: React.FC<MergePanelProps> = ({
    overlayImage, onOverlayUpload, overlayConfig, onOverlayConfigChange, mergeConfig, onMergeConfigChange, onCommit, disabled
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onOverlayUpload(file);
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleConfigChange = (key: keyof OverlayConfig, value: number) => {
        onOverlayConfigChange({ ...overlayConfig, [key]: value });
    };

    const handleMergeToolChange = (tool: MergeConfig['tool']) => {
        onMergeConfigChange({ ...mergeConfig, tool });
    }
    const handleBrushSizeChange = (brushSize: number) => {
        onMergeConfigChange({ ...mergeConfig, brushSize });
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-cyan-300">Merge & Blend</h3>
            
            {!overlayImage && (
                <>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" disabled={disabled} />
                    <button onClick={handleButtonClick} disabled={disabled} className="w-full flex items-center justify-center py-4 px-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-cyan-500 hover:bg-gray-700/50 transition-colors">
                        <UploadIcon className="w-6 h-6 mr-3" />
                        <span>Upload Overlay Image</span>
                    </button>
                </>
            )}

            {overlayImage && (
                <div className="space-y-4">
                    <div className="bg-gray-900 p-3 rounded-md">
                        <p className="text-gray-300 truncate text-sm">Overlay: <span className="font-semibold text-cyan-400">{overlayImage.name}</span></p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-300 mb-2">Tools</p>
                        <div className="grid grid-cols-3 gap-2">
                           <ToolButton label="Move" icon={<MoveIcon className="w-5 h-5"/>} isActive={mergeConfig.tool === 'move'} onClick={() => handleMergeToolChange('move')} />
                           <ToolButton label="Brush" icon={<BrushIcon className="w-5 h-5"/>} isActive={mergeConfig.tool === 'brush'} onClick={() => handleMergeToolChange('brush')} />
                           <ToolButton label="Eraser" icon={<EraserIcon className="w-5 h-5"/>} isActive={mergeConfig.tool === 'eraser'} onClick={() => handleMergeToolChange('eraser')} />
                        </div>
                    </div>
                    
                    {(mergeConfig.tool === 'brush' || mergeConfig.tool === 'eraser') && (
                        <Slider label="Size" value={mergeConfig.brushSize} min={2} max={150} onChange={(v) => handleBrushSizeChange(v)} disabled={disabled} />
                    )}

                    <Slider label="Opacity" value={overlayConfig.opacity} min={0} max={100} onChange={(v) => handleConfigChange('opacity', v)} disabled={disabled} />
                    <Slider label="Scale" value={overlayConfig.scale} min={0.1} max={5} step={0.05} onChange={(v) => handleConfigChange('scale', v)} disabled={disabled} />
                    <Slider label="Rotation" value={overlayConfig.rotation} min={-180} max={180} onChange={(v) => handleConfigChange('rotation', v)} disabled={disabled} />
                    
                    <button onClick={onCommit} disabled={disabled} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition-colors disabled:bg-gray-600">
                        Commit Merge
                    </button>
                </div>
            )}
        </div>
    );
};

export default MergePanel;
