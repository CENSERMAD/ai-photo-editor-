import React from 'react';
import { SparklesIcon, SlidersIcon, FilterIcon, UndoIcon, RedoIcon, RotateCcwIcon, WandIcon, PaletteIcon, LayersIcon, TypeIcon } from './icons';

type ActiveTool = 'adjust' | 'ai-filters' | 'ai-tools' | 'effects' | 'ai-styles' | 'merge' | 'text';

interface ToolbarProps {
  activeTool: ActiveTool;
  onToolSelect: (tool: ActiveTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const ToolButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  isAction?: boolean;
}> = ({ icon, label, isActive, onClick, disabled, isAction }) => {
  const activeClasses = 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30';
  const inactiveClasses = 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white';
  const actionClasses = 'bg-gray-700 hover:bg-cyan-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      data-tooltip={label}
      className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg transition-all duration-200 group relative ${isAction ? actionClasses : (isActive ? activeClasses : inactiveClasses)}`}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
      <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none z-20">
        {label}
      </div>
    </button>
  );
};


const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onToolSelect, onUndo, onRedo, onReset, canUndo, canRedo }) => {
  return (
    <aside className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 flex flex-col items-center space-y-4">
      <h2 className="text-sm font-bold text-gray-400 sr-only">Tools</h2>
      
      <div className="w-full border-b border-gray-600 pb-4 space-y-3">
         <ToolButton
            icon={<SparklesIcon className="w-6 h-6" />}
            label="AI Tools"
            isActive={activeTool === 'ai-tools'}
            onClick={() => onToolSelect('ai-tools')}
        />
         <ToolButton
            icon={<FilterIcon className="w-6 h-6" />}
            label="AI Filters"
            isActive={activeTool === 'ai-filters'}
            onClick={() => onToolSelect('ai-filters')}
        />
         <ToolButton
            icon={<PaletteIcon className="w-6 h-6" />}
            label="AI Styles"
            isActive={activeTool === 'ai-styles'}
            onClick={() => onToolSelect('ai-styles')}
        />
        <ToolButton
            icon={<LayersIcon className="w-6 h-6" />}
            label="Merge"
            isActive={activeTool === 'merge'}
            onClick={() => onToolSelect('merge')}
        />
        <ToolButton
            icon={<TypeIcon className="w-6 h-6" />}
            label="Text"
            isActive={activeTool === 'text'}
            onClick={() => onToolSelect('text')}
        />
        <ToolButton
            icon={<SlidersIcon className="w-6 h-6" />}
            label="Adjust"
            isActive={activeTool === 'adjust'}
            onClick={() => onToolSelect('adjust')}
        />
        <ToolButton
            icon={<WandIcon className="w-6 h-6" />}
            label="Effects"
            isActive={activeTool === 'effects'}
            onClick={() => onToolSelect('effects')}
        />
      </div>

      <div className="space-y-3">
         <ToolButton
            icon={<UndoIcon className="w-6 h-6" />}
            label="Undo"
            onClick={onUndo}
            disabled={!canUndo}
            isAction
        />
        <ToolButton
            icon={<RedoIcon className="w-6 h-6" />}
            label="Redo"
            onClick={onRedo}
            disabled={!canRedo}
            isAction
        />
        <ToolButton
            icon={<RotateCcwIcon className="w-6 h-6" />}
            label="Reset"
            onClick={onReset}
            disabled={!canUndo}
            isAction
        />
      </div>
    </aside>
  );
};

export default Toolbar;
