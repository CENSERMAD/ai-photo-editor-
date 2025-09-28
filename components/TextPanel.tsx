import React, { useState, useEffect } from 'react';
import { TextObject } from '../App';
import Slider from './Slider';
import { TrashIcon, BoldIcon, ItalicIcon, UnderlineIcon } from './icons';

interface TextPanelProps {
    onAddText: (text: TextObject) => void;
    onUpdateText: (text: TextObject) => void;
    onDeleteText: (id: string) => void;
    onCommitText: () => void;
    activeTextObject: TextObject | null;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    disabled?: boolean;
}

const fonts = ['Arial', 'Verdana', 'Georgia', 'Courier New', 'Impact', 'Comic Sans MS'];

const StyleButton: React.FC<{
  label: string;
  onClick: () => void;
  isActive: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ label, onClick, isActive, disabled, children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={isActive}
        className={`p-2 rounded-md transition-colors ${isActive ? 'bg-cyan-500 text-white' : 'hover:bg-gray-700'}`}
    >
        {children}
    </button>
);

const TextPanel: React.FC<TextPanelProps> = ({ 
    onAddText, onUpdateText, onDeleteText, onCommitText, activeTextObject, canvasRef, disabled 
}) => {
    const [text, setText] = useState('Hello World');
    const [font, setFont] = useState('Impact');
    const [size, setSize] = useState(80);
    const [color, setColor] = useState('#FFFFFF');
    const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>('normal');
    const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>('normal');
    const [textDecoration, setTextDecoration] = useState<'none' | 'underline'>('none');

    useEffect(() => {
        if (activeTextObject) {
            setText(activeTextObject.text);
            setFont(activeTextObject.font);
            setSize(activeTextObject.size);
            setColor(activeTextObject.color);
            setFontWeight(activeTextObject.fontWeight);
            setFontStyle(activeTextObject.fontStyle);
            setTextDecoration(activeTextObject.textDecoration);
        } else {
            // Reset to default when no text is active
            setFontWeight('normal');
            setFontStyle('normal');
            setTextDecoration('none');
        }
    }, [activeTextObject]);

    const handleAdd = () => {
        if (!canvasRef.current || !text) return;
        const newText: TextObject = {
            id: Date.now().toString(),
            text,
            font,
            size,
            color,
            x: canvasRef.current.width / 2,
            y: canvasRef.current.height / 2,
            fontWeight,
            fontStyle,
            textDecoration,
        };
        onAddText(newText);
    };

    const handleUpdate = (key: keyof TextObject, value: any) => {
        if (!activeTextObject) return;
        onUpdateText({ ...activeTextObject, [key]: value });
    };

    const handleStyleToggle = (
        style: 'fontWeight' | 'fontStyle' | 'textDecoration'
    ) => {
        let newValue: string;
        if (style === 'fontWeight') {
            newValue = fontWeight === 'bold' ? 'normal' : 'bold';
            setFontWeight(newValue as 'normal' | 'bold');
        } else if (style === 'fontStyle') {
            newValue = fontStyle === 'italic' ? 'normal' : 'italic';
            setFontStyle(newValue as 'normal' | 'italic');
        } else {
            newValue = textDecoration === 'underline' ? 'none' : 'underline';
            setTextDecoration(newValue as 'none' | 'underline');
        }

        if (activeTextObject) {
            handleUpdate(style, newValue);
        }
    };

    const handleDelete = () => {
        if (activeTextObject) {
            onDeleteText(activeTextObject.id);
        }
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-cyan-300">Text Tool</h3>
            
            <div className="space-y-2">
                <label htmlFor="text-input" className="text-sm font-medium text-gray-300">Text Content</label>
                <textarea
                    id="text-input"
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        if (activeTextObject) handleUpdate('text', e.target.value);
                    }}
                    disabled={disabled}
                    className="w-full h-20 bg-gray-900 border-2 border-gray-600 rounded-md p-2 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-colors"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="font-select" className="text-sm font-medium text-gray-300">Font</label>
                    <select
                        id="font-select"
                        value={font}
                        onChange={(e) => {
                            setFont(e.target.value);
                            if (activeTextObject) handleUpdate('font', e.target.value);
                        }}
                        disabled={disabled}
                        className="w-full bg-gray-900 border-2 border-gray-600 rounded-md p-2 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-colors"
                    >
                        {fonts.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label htmlFor="color-picker" className="text-sm font-medium text-gray-300">Color</label>
                    <input
                        id="color-picker"
                        type="color"
                        value={color}
                        onChange={(e) => {
                            setColor(e.target.value);
                            if (activeTextObject) handleUpdate('color', e.target.value);
                        }}
                        disabled={disabled}
                        className="w-full h-10 p-1 bg-gray-900 border-2 border-gray-600 rounded-md cursor-pointer"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                 <label className="text-sm font-medium text-gray-300">Style</label>
                 <div className="flex items-center gap-1 p-1 bg-gray-900 rounded-md">
                     <StyleButton label="Bold" onClick={() => handleStyleToggle('fontWeight')} isActive={fontWeight === 'bold'} disabled={disabled}>
                         <BoldIcon className="w-5 h-5" />
                     </StyleButton>
                     <StyleButton label="Italic" onClick={() => handleStyleToggle('fontStyle')} isActive={fontStyle === 'italic'} disabled={disabled}>
                         <ItalicIcon className="w-5 h-5" />
                     </StyleButton>
                     <StyleButton label="Underline" onClick={() => handleStyleToggle('textDecoration')} isActive={textDecoration === 'underline'} disabled={disabled}>
                         <UnderlineIcon className="w-5 h-5" />
                     </StyleButton>
                 </div>
            </div>

            <Slider 
                label="Size" 
                value={size} 
                min={10} 
                max={300} 
                onChange={(v) => {
                    setSize(v);
                    if (activeTextObject) handleUpdate('size', v);
                }} 
                disabled={disabled} 
            />

            {!activeTextObject && (
                <button onClick={handleAdd} disabled={disabled || !text} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition-colors disabled:bg-gray-600">
                    Add Text to Image
                </button>
            )}

            {activeTextObject && (
                <div className="flex items-center gap-2">
                    <button onClick={handleDelete} disabled={disabled} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold p-3 rounded-lg flex items-center justify-center transition-colors disabled:bg-gray-600" aria-label="Delete selected text">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            )}
            
            <button onClick={onCommitText} disabled={disabled} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition-colors disabled:bg-gray-600">
                Commit Text
            </button>
        </div>
    );
};

export default TextPanel;
