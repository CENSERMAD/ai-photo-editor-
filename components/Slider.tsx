import React from 'react';

interface SliderProps {
    label: string;
    value: number;
    onChange: (value: number, commit: boolean) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
}

const Slider: React.FC<SliderProps> = ({ label, value, onChange, min = 0, max = 100, step = 1, disabled }) => {
    
    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(parseFloat(e.target.value), false);
    };

    const handleCommit = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
        onChange(parseFloat((e.target as HTMLInputElement).value), true);
    }
    
    const backgroundSize = ((value - min) * 100) / (max - min) + '% 100%';

    return (
        <div className="grid grid-cols-4 items-center gap-3">
            <label htmlFor={label} className="text-sm font-medium text-gray-300 col-span-1">{label}</label>
            <input
                id={label}
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={handleValueChange}
                onMouseUp={handleCommit}
                onTouchEnd={handleCommit}
                disabled={disabled}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer col-span-2 slider-thumb"
                style={{ 
                    backgroundSize,
                    // @ts-ignore
                    '--thumb-color': '#0891b2',
                    '--track-color': '#4b5563',
                    '--progress-color': '#06b6d4'
                }}
            />
            <span className="text-sm font-mono bg-gray-900 text-center py-1 rounded-md text-cyan-300 col-span-1">{value.toFixed(0)}</span>
            <style>{`
                .slider-thumb {
                    background-image: linear-gradient(to right, var(--progress-color), var(--progress-color));
                    background-repeat: no-repeat;
                    background-color: var(--track-color);
                }
                .slider-thumb::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--thumb-color);
                    cursor: pointer;
                    border: 2px solid #f9fafb;
                }
                .slider-thumb::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--thumb-color);
                    cursor: pointer;
                    border: 2px solid #f9fafb;
                }
            `}</style>
        </div>
    );
};

export default Slider;
