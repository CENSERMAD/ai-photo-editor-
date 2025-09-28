import React, { useState, useCallback, useRef } from 'react';
import { editImageWithGemini } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import ImageDisplay from './components/ImageDisplay';
import Loader from './components/Loader';
import Toolbar from './components/Toolbar';
import AdjustmentPanel from './components/AdjustmentPanel';
import EffectsPanel from './components/EffectsPanel';
import ExportModal from './components/ExportModal';
import MergePanel from './components/MergePanel';
import TextPanel from './components/TextPanel';
import { SparklesIcon, AlertTriangleIcon, BriefcaseIcon, EraserIcon, PlusCircleIcon, MaximizeIcon, DownloadIcon, LinkIcon, FilterIcon, AutoEnhanceIcon, ScissorsIcon, SmileIcon, LightbulbIcon, ScanTextIcon, ExpandIcon } from './components/icons';

export interface ImageData {
  base64: string;
  mimeType: string;
  name: string;
}

type AiAction = 'generate' | 'formal' | 'remove' | 'add' | 'resolution' | 'vintage' | 'noir' | 'neonpunk' | 'enhance' | 'background' | 'retouch' | 'style-ghibli' | 'style-anime' | 'style-cartoon' | 'style-vangogh' | 'style-oil' | 'style-pixel' | 'style-steampunk' | 'ocr' | 'expand' | 'suggestions';
type ActiveTool = 'adjust' | 'ai-filters' | 'ai-tools' | 'effects' | 'ai-styles' | 'merge' | 'text';

interface Adjustments {
  brightness: number;
  contrast: number;
  saturate: number;
  hue: number;
  blur: number;
}

interface Transform {
    rotation: number;
    flipH: boolean;
}

interface Effects {
    preset: 'none' | 'sepia' | 'grayscale' | 'invert';
    vignette: number;
    noise: number;
}

export interface TextObject {
    id: string;
    text: string;
    x: number;
    y: number;
    size: number;
    color: string;
    font: string;
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    textDecoration: 'none' | 'underline';
    width?: number; // Calculated dynamically for hit detection
    height?: number; // Calculated dynamically for hit detection
}


export interface EditorState {
    adjustments: Adjustments;
    transform: Transform;
    effects: Effects;
}

export interface OverlayConfig {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    opacity: number;
}

export interface MergeConfig {
    tool: 'move' | 'brush' | 'eraser';
    brushSize: number;
}


const initialEditorState: EditorState = {
    adjustments: { brightness: 100, contrast: 100, saturate: 100, hue: 0, blur: 0 },
    transform: { rotation: 0, flipH: false },
    effects: { preset: 'none', vignette: 0, noise: 0 },
};

const initialOverlayConfig: OverlayConfig = { x: 0, y: 0, scale: 1, rotation: 0, opacity: 50 };
const initialMergeConfig: MergeConfig = { tool: 'move', brushSize: 40 };

interface Filter {
    name: string;
    prompt: string;
    action: AiAction;
    colorClasses: string;
}

const filters: Filter[] = [
    {
        name: 'Vintage',
        action: 'vintage',
        colorClasses: 'bg-amber-600 hover:bg-amber-500',
        prompt: 'Apply a vintage photo effect to this image. Give it a warm, faded look with slightly desaturated colors, soft focus, and subtle film grain, reminiscent of an old photograph from the 1970s.',
    },
    {
        name: 'Noir',
        action: 'noir',
        colorClasses: 'bg-slate-600 hover:bg-slate-500',
        prompt: 'Convert this image to a high-contrast black and white "noir" style. Emphasize deep blacks, bright whites, and dramatic shadows to create a moody, cinematic atmosphere.',
    },
    {
        name: 'Neon Punk',
        action: 'neonpunk',
        colorClasses: 'bg-purple-600 hover:bg-purple-500',
        prompt: 'Transform this image with a "Neon Punk" aesthetic. Infuse the scene with vibrant, glowing neon colors, particularly magenta, cyan, and electric blue. Add digital glitch effects, sharp high-tech details, and a dark, futuristic urban vibe.',
    }
];

interface Style {
    name: string;
    prompt: string;
    action: AiAction;
    colorClasses: string;
}

const styles: Style[] = [
    {
        name: 'Ghibli Style',
        action: 'style-ghibli',
        colorClasses: 'bg-green-600 hover:bg-green-500',
        prompt: 'Transform this image into the style of a Ghibli anime film. Use soft, painterly backgrounds, expressive character designs, and a whimsical, nostalgic color palette.',
    },
    {
        name: 'Modern Anime',
        action: 'style-anime',
        colorClasses: 'bg-sky-500 hover:bg-sky-400',
        prompt: 'Convert this image into a modern anime style. Use sharp lines, vibrant colors, large expressive eyes for any figures, and dynamic cel-shaded lighting.',
    },
    {
        name: 'Cartoon',
        action: 'style-cartoon',
        colorClasses: 'bg-blue-500 hover:bg-blue-400',
        prompt: 'Redraw this image in a classic American cartoon style, similar to animated shows from the 9s. Use bold outlines, simplified shapes, and bright, flat colors.',
    },
    {
        name: 'Van Gogh',
        action: 'style-vangogh',
        colorClasses: 'bg-yellow-500 hover:bg-yellow-400',
        prompt: 'Reimagine this image in the style of Vincent van Gogh. Use thick, impasto brushstrokes, swirling patterns, and a vibrant, emotional color palette with lots of blues and yellows.',
    },
    {
        name: 'Oil Painting',
        action: 'style-oil',
        colorClasses: 'bg-amber-700 hover:bg-amber-600',
        prompt: 'Transform this image into a classic oil painting. Emphasize realistic lighting and shadows, rich textures, and visible brushwork, as if painted on canvas.',
    },
    {
        name: 'Pixel Art',
        action: 'style-pixel',
        colorClasses: 'bg-violet-600 hover:bg-violet-500',
        prompt: 'Turn this image into 16-bit pixel art. Simplify details into colored squares (pixels), use a limited color palette, and give it a retro video game look.',
    },
    {
        name: 'Steampunk',
        action: 'style-steampunk',
        colorClasses: 'bg-orange-800 hover:bg-orange-700',
        prompt: 'Infuse this image with a Steampunk aesthetic. Add mechanical gears, copper and brass elements, Victorian-era fashion, and a sepia-toned, industrial atmosphere.',
    },
];

const promptSuggestions = [
    "Make the sky a dramatic, stormy purple.",
    "Add a majestic dragon flying in the background.",
    "Turn this into a vintage black and white photo from the 1940s.",
    "Apply a glowing, neon-punk aesthetic.",
    "Redraw this in the style of a comic book.",
];

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  
  const [removeObjectPrompt, setRemoveObjectPrompt] = useState('');
  const [addObjectPrompt, setAddObjectPrompt] = useState('');
  const [resolutionPrompt, setResolutionPrompt] = useState('');
  const [expandPrompt, setExpandPrompt] = useState('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeAiAction, setActiveAiAction] = useState<AiAction | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool>('ai-tools');
  const [error, setError] = useState<string | null>(null);
  const [aiResponseText, setAiResponseText] = useState<string | null>(null);

  const [history, setHistory] = useState<EditorState[]>([initialEditorState]);
  const [historyPointer, setHistoryPointer] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // State for Merge Tool
  const [overlayImage, setOverlayImage] = useState<ImageData | null>(null);
  const [overlayConfig, setOverlayConfig] = useState<OverlayConfig>(initialOverlayConfig);
  const [mergeConfig, setMergeConfig] = useState<MergeConfig>(initialMergeConfig);

  // State for Text Tool
  const [textObjects, setTextObjects] = useState<TextObject[]>([]);
  const [activeTextId, setActiveTextId] = useState<string | null>(null);


  const currentEditorState = history[historyPointer];

  const updateEditorState = (newEditorState: EditorState, commit: boolean) => {
    let newHistory = [...history];
    if (commit) {
        newHistory = history.slice(0, historyPointer + 1);
        newHistory.push(newEditorState);
        setHistory(newHistory);
        setHistoryPointer(newHistory.length - 1);
    } else {
        newHistory[historyPointer] = newEditorState;
        setHistory(newHistory);
    }
  };

  const handleUndo = () => {
      if (historyPointer > 0) setHistoryPointer(p => p - 1);
  };

  const handleRedo = () => {
      if (historyPointer < history.length - 1) setHistoryPointer(p => p - 1);
  };
  
  const handleClientReset = () => {
      const newHistory = [initialEditorState];
      setHistory(newHistory);
      setHistoryPointer(0);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = useCallback(async (file: File) => {
    setError(null);
    setEditedImage(null);
    setAiResponseText(null);
    setIsLoading(true);
    setHistory([initialEditorState]);
    setHistoryPointer(0);
    // Also reset merge/text state
    setOverlayImage(null);
    setOverlayConfig(initialOverlayConfig);
    setMergeConfig(initialMergeConfig);
    setTextObjects([]);
    setActiveTextId(null);
    try {
      const base64String = await fileToBase64(file);
      setOriginalImage({
        base64: base64String.split(',')[1],
        mimeType: file.type,
        name: file.name,
      });
    } catch (e) {
      setError('Failed to read the image file.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const executeAiAction = async (prompt: string, action: AiAction) => {
    if (!canvasRef.current) {
        setError('Image canvas is not ready.');
        return;
    }

    const canvas = canvasRef.current;
    const base64ImageData = canvas.toDataURL('image/png').split(',')[1];

    setError(null);
    setAiResponseText(null);
    setActiveAiAction(action);
    setIsLoading(true);

    try {
      const result = await editImageWithGemini(base64ImageData, 'image/png', prompt);
      const textOnlyActions: AiAction[] = ['ocr', 'suggestions'];
      
      if (result.imageUrl) {
        setOriginalImage(prev => ({
            base64: result.imageUrl!,
            mimeType: 'image/png',
            name: prev ? `${prev.name.split('.').slice(0, -1).join('.')}-edited.png` : 'ai-edited.png',
        }));
        setEditedImage(null); 
        handleClientReset();
        
        // Clear prompts that were just used.
        if (action === 'generate') setPrompt('');
        if (action === 'remove') setRemoveObjectPrompt('');
        if (action === 'add') setAddObjectPrompt('');
        if (action === 'resolution') setResolutionPrompt('');
        if (action === 'expand') setExpandPrompt('');

      } else if (textOnlyActions.includes(action) && result.text) {
          // This is a successful text-only response. We don't change the image.
      } else {
        setError("The AI didn't return an image. It might have refused the request or the action was text-only and failed.");
      }
      setAiResponseText(result.text || `Action '${action}' completed successfully.`);
    } catch (e: any) {
      setError(`An error occurred: ${e.message}`);
      console.error(e);
    } finally {
      setIsLoading(false);
      setActiveAiAction(null);
    }
  };

  const handleGenerate = () => {
    if (!prompt) { setError('Please provide an editing prompt.'); return; }
    executeAiAction(prompt, 'generate');
  };
  const handleMakeFormal = () => executeAiAction("Transform this image into a professional headshot. Change the person's attire to a formal business suit (e.g., a dark blazer, white shirt, and a tie for men, or equivalent professional attire for women). Replace the background with a clean, solid white or light gray color suitable for a corporate profile picture. Maintain the person's facial features and enhance the overall quality to be sharp and professional.", 'formal');
  const handleMagicRemove = () => {
    if (!removeObjectPrompt) { setError('Please describe the object to remove.'); return; }
    executeAiAction(`Magically remove the following from the image: ${removeObjectPrompt}. Fill in the background seamlessly and realistically, maintaining the original style.`, 'remove');
  };
  const handleAddObject = () => {
    if (!addObjectPrompt) { setError('Please describe the object to add.'); return; }
    executeAiAction(`Add the following to the image: ${addObjectPrompt}. Make it look natural and blend perfectly with the existing lighting, shadows, and perspective.`, 'add');
  };
  const handleChangeResolution = () => {
    if (!resolutionPrompt) { setError('Please describe the desired resolution or style.'); return; }
    executeAiAction(`Change the style and enhance the resolution of this image to be: ${resolutionPrompt}. Increase detail, clarity, and overall quality according to the description.`, 'resolution');
  };
  const handleApplyFilter = (filter: Filter) => executeAiAction(filter.prompt, filter.action);
  const handleApplyStyle = (style: Style) => executeAiAction(style.prompt, style.action);
  
  const handleAutoEnhance = () => executeAiAction("Automatically enhance this image. Improve brightness, contrast, color balance, and sharpness to make it look more professional and vibrant, while keeping the result natural and realistic.", 'enhance');
  const handleRemoveBackground = () => executeAiAction("Remove the background from this image completely. The subject should be perfectly cutout. Make the new background transparent. The output must be a PNG file with an alpha channel for the transparency. Do not add any new background, just make it transparent.", 'background');
  const handleFaceRetouch = () => executeAiAction("Perform a subtle and natural face retouch on the person in this image. Smooth the skin slightly to reduce minor blemishes, gently whiten the teeth if they are visible, and correct any red-eye effect. The result should look realistic and not overly edited.", 'retouch');
  
  // New Feature Handlers
  const handleGetSuggestions = () => executeAiAction("Analyze this photograph and suggest 3 concise, creative editing ideas. For example, suggest filters, style transfers, objects to add/remove, or color adjustments.", 'suggestions');
  const handleExtractText = () => executeAiAction("Read and extract all text from this image. If no text is present, respond with 'No text found'.", 'ocr');
  const handleExpandImage = () => {
      if (!expandPrompt) { setError('Please describe how to expand the image.'); return; }
      executeAiAction(`Expand the image based on these instructions: ${expandPrompt}. Fill in the new areas seamlessly and realistically, maintaining the original style.`, 'expand');
  };

  const handleFullReset = () => {
    setOriginalImage(null);
    setEditedImage(null);
    setPrompt('');
    setRemoveObjectPrompt('');
    setAddObjectPrompt('');
    setResolutionPrompt('');
    setExpandPrompt('');
    setError(null);
    setAiResponseText(null);
    setIsLoading(false);
    setActiveAiAction(null);
    setHistory([initialEditorState]);
    setHistoryPointer(0);
    setOverlayImage(null);
    setOverlayConfig(initialOverlayConfig);
    setMergeConfig(initialMergeConfig);
    setTextObjects([]);
    setActiveTextId(null);
  };
  
  const openExportModal = () => {
    // Export should work on the current canvas state, not the last edited image
    if (originalImage) {
        setIsExportModalOpen(true);
    }
  };
  
  const handleOverlayUpload = async (file: File) => {
    setError(null);
    try {
        const base64String = await fileToBase64(file);
        setOverlayImage({
            base64: base64String.split(',')[1],
            mimeType: file.type,
            name: file.name,
        });
        // Reset configs for new overlay
        setOverlayConfig(initialOverlayConfig);
        setMergeConfig(initialMergeConfig);

    } catch (e) {
        setError('Failed to read the overlay image file.');
        console.error(e);
    }
  };

  const handleCommitMerge = () => {
      if (!canvasRef.current || !overlayImage) return;

      const dataUrl = canvasRef.current.toDataURL('image/png');
      
      setOriginalImage(prev => ({
        base64: dataUrl.split(',')[1],
        mimeType: 'image/png',
        name: prev ? `${prev.name.split('.').slice(0, -1).join('.')}-merged.png` : 'merged.png',
      }));
      
      // Reset state
      setOverlayImage(null);
      setOverlayConfig(initialOverlayConfig);
      setMergeConfig(initialMergeConfig);
      handleClientReset(); // Reset adjustments for the newly merged image
  };

  const handleAddText = (text: TextObject) => {
    setTextObjects([...textObjects, text]);
    setActiveTextId(text.id);
  };

  const handleUpdateText = (updatedText: TextObject) => {
    setTextObjects(textObjects.map(t => t.id === updatedText.id ? updatedText : t));
  };
  
  const handleDeleteText = (id: string) => {
    setTextObjects(textObjects.filter(t => t.id !== id));
    if (activeTextId === id) {
        setActiveTextId(null);
    }
  };

  const handleCommitText = () => {
      if (!canvasRef.current || textObjects.length === 0) return;

      const dataUrl = canvasRef.current.toDataURL('image/png');
      
      setOriginalImage(prev => ({
        base64: dataUrl.split(',')[1],
        mimeType: 'image/png',
        name: prev ? `${prev.name.split('.').slice(0, -1).join('.')}-text.png` : 'text.png',
      }));

      setTextObjects([]);
      setActiveTextId(null);
      handleClientReset();
  };


  const QuickActionButton: React.FC<{
    onClick: () => void; action: AiAction; icon: React.ReactNode; text: string;
    colorClass: string; disabled?: boolean; className?: string;
  }> = ({ onClick, action, icon, text, colorClass, disabled, className }) => {
      const baseColor = colorClass.split('-')[0];
      const hoverBgClass = `hover:bg-${baseColor}-500`;

      return (
          <button onClick={onClick} disabled={isLoading || disabled}
              className={`w-full flex items-center justify-center ${colorClass} ${hoverBgClass} disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 disabled:shadow-none disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none ${className}`}>
              {isLoading && activeAiAction === action ? (
                  <><Loader small={true} /><span className="ml-2">Processing...</span></>
              ) : ( <>{icon}{text}</> )}
          </button>
      );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
       <header className="text-center mb-4 border-b-2 border-cyan-500/30 pb-4 pt-4 sm:pt-6 lg:pt-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400 tracking-wider" style={{ textShadow: '0 0 10px #06b6d4, 0 0 20px #0891b2' }}>
          AI Photo Editor // Future Vision
        </h1>
        <p className="text-lg text-gray-400 mt-2">Transform your images with futuristic AI prompts.</p>
        <a href="https://chatgpt.com/s/t_68d8f0e94bfc8191966e8af5b694bbb4" target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors duration-200 mt-2 inline-flex items-center gap-1 group">
            <LinkIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span>Inspired by this conversation</span>
        </a>
      </header>
      
      <main className="flex-grow flex p-4 sm:p-6 lg:p-8 pt-0 gap-8">
        {originalImage && 
            <Toolbar 
              activeTool={activeTool}
              onToolSelect={(tool) => { setActiveTool(tool); setActiveTextId(null); }}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onReset={handleClientReset}
              canUndo={historyPointer > 0}
              canRedo={historyPointer < history.length - 1}
            />
        }
        
        {/* Control Panel */}
        <div className="flex-shrink-0 w-full max-w-lg bg-gray-800/50 p-6 rounded-lg border border-gray-700 shadow-lg shadow-cyan-500/10 flex flex-col space-y-6">
          {!originalImage && <ImageUploader onImageUpload={handleImageUpload} isLoading={isLoading} />}
          {originalImage && (
            <>
              <div className="flex justify-between items-center bg-gray-900 p-3 rounded-md">
                  <p className="text-gray-300 truncate pr-4">Loaded: <span className="font-semibold text-cyan-400">{originalImage.name}</span></p>
                  <button onClick={handleFullReset} className="text-sm bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded transition-colors duration-200">Reset All</button>
              </div>

              {activeTool === 'adjust' && (
                  <AdjustmentPanel 
                    editorState={currentEditorState} 
                    onStateChange={updateEditorState}
                    disabled={isLoading} 
                  />
              )}

              {activeTool === 'effects' && (
                  <EffectsPanel
                    editorState={currentEditorState}
                    onStateChange={updateEditorState}
                    disabled={isLoading}
                  />
              )}

              {activeTool === 'merge' && (
                  <MergePanel
                    overlayImage={overlayImage}
                    onOverlayUpload={handleOverlayUpload}
                    overlayConfig={overlayConfig}
                    onOverlayConfigChange={setOverlayConfig}
                    mergeConfig={mergeConfig}
                    onMergeConfigChange={setMergeConfig}
                    onCommit={handleCommitMerge}
                    disabled={isLoading}
                  />
              )}
              
              {activeTool === 'text' && (
                  <TextPanel
                    onAddText={handleAddText}
                    onUpdateText={handleUpdateText}
                    onDeleteText={handleDeleteText}
                    onCommitText={handleCommitText}
                    activeTextObject={textObjects.find(t => t.id === activeTextId) || null}
                    canvasRef={canvasRef}
                    disabled={isLoading}
                  />
              )}

              {activeTool === 'ai-tools' && (
                <div className="flex flex-col space-y-4">
                  <div>
                    <label htmlFor="prompt" className="block text-lg font-semibold mb-2 text-cyan-300">Your Vision (Custom Prompt)</label>
                    <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., 'Add a neon-lit cyberpunk city...'"
                      className="w-full h-24 bg-gray-900 border-2 border-gray-600 rounded-md p-3 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 placeholder-gray-500 resize-none"
                      disabled={isLoading} />
                     <div className="flex flex-wrap gap-2 mt-2">
                        {promptSuggestions.map((p, i) => (
                            <button
                                key={i}
                                onClick={() => setPrompt(p)}
                                disabled={isLoading}
                                className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-full hover:bg-cyan-600 hover:text-white transition-colors"
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                  </div>
                  <QuickActionButton onClick={handleGenerate} action="generate" icon={<SparklesIcon className="w-6 h-6 mr-2" />} text="Generate with Prompt" colorClass="bg-cyan-600" disabled={!prompt} />
                  <div className="relative flex pt-2 pb-1 items-center">
                    <div className="flex-grow border-t border-gray-600"></div>
                    <span className="flex-shrink mx-4 text-gray-400 font-bold text-lg">Quick Actions</span>
                    <div className="flex-grow border-t border-gray-600"></div>
                  </div>

                  <QuickActionButton onClick={handleGetSuggestions} action="suggestions" icon={<LightbulbIcon className="w-6 h-6 mr-2" />} text="Get AI Suggestions" colorClass="bg-yellow-600" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <QuickActionButton onClick={handleAutoEnhance} action="enhance" icon={<AutoEnhanceIcon className="w-6 h-6 mr-2" />} text="Auto Enhance" colorClass="bg-teal-600" />
                    <QuickActionButton onClick={handleRemoveBackground} action="background" icon={<ScissorsIcon className="w-6 h-6 mr-2" />} text="Remove BG" colorClass="bg-slate-600" />
                    <QuickActionButton onClick={handleFaceRetouch} action="retouch" icon={<SmileIcon className="w-6 h-6 mr-2" />} text="Face Retouch" colorClass="bg-rose-600" />
                    <QuickActionButton onClick={handleMakeFormal} action="formal" icon={<BriefcaseIcon className="w-6 h-6 mr-2" />} text="Make Formal" colorClass="bg-indigo-600" />
                    <QuickActionButton onClick={handleExtractText} action="ocr" icon={<ScanTextIcon className="w-6 h-6 mr-2" />} text="Extract Text" colorClass="bg-sky-600" className="md:col-span-2" />
                    
                    <div className="space-y-2">
                        <input type="text" value={removeObjectPrompt} onChange={(e) => setRemoveObjectPrompt(e.target.value)} placeholder="Object to remove..." className="w-full bg-gray-900 border-2 border-gray-600 rounded-md p-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/50 transition-all duration-300 placeholder-gray-500 text-sm" disabled={isLoading} />
                        <QuickActionButton onClick={handleMagicRemove} action="remove" icon={<EraserIcon className="w-6 h-6 mr-2" />} text="Magic Remove" colorClass="bg-pink-600" disabled={!removeObjectPrompt} />
                    </div>

                    <div className="space-y-2">
                      <input type="text" value={addObjectPrompt} onChange={(e) => setAddObjectPrompt(e.target.value)} placeholder="Object to add..." className="w-full bg-gray-900 border-2 border-gray-600 rounded-md p-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/50 transition-all duration-300 placeholder-gray-500 text-sm" disabled={isLoading} />
                      <QuickActionButton onClick={handleAddObject} action="add" icon={<PlusCircleIcon className="w-6 h-6 mr-2" />} text="Magic Add" colorClass="bg-green-600" disabled={!addObjectPrompt} />
                    </div>
                    
                    <div className="space-y-2 col-span-1 md:col-span-2">
                       <input type="text" value={expandPrompt} onChange={(e) => setExpandPrompt(e.target.value)} placeholder="e.g., 'expand the sky upwards'" className="w-full bg-gray-900 border-2 border-gray-600 rounded-md p-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 placeholder-gray-500 text-sm" disabled={isLoading} />
                       <QuickActionButton onClick={handleExpandImage} action="expand" icon={<ExpandIcon className="w-6 h-6 mr-2" />} text="Generative Expand" colorClass="bg-purple-600" disabled={!expandPrompt} />
                    </div>

                    <div className="space-y-2 col-span-1 md:col-span-2">
                       <input type="text" value={resolutionPrompt} onChange={(e) => setResolutionPrompt(e.target.value)} placeholder="e.g., '4K, photorealistic'" className="w-full bg-gray-900 border-2 border-gray-600 rounded-md p-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50 transition-all duration-300 placeholder-gray-500 text-sm" disabled={isLoading} />
                       <QuickActionButton onClick={handleChangeResolution} action="resolution" icon={<MaximizeIcon className="w-6 h-6 mr-2" />} text="Resolution/Style" colorClass="bg-orange-600" disabled={!resolutionPrompt} />
                    </div>
                  </div>
                </div>
              )}
              {activeTool === 'ai-filters' && (
                <div className="flex flex-col space-y-4">
                  <div className="relative flex items-center">
                    <div className="flex-grow border-t border-gray-600"></div>
                    <span className="flex-shrink mx-4 text-gray-400 font-bold text-lg">Creative AI Filters</span>
                    <div className="flex-grow border-t border-gray-600"></div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                      {filters.map((filter) => (
                          <button key={filter.action} onClick={() => handleApplyFilter(filter)} disabled={isLoading}
                              className={`w-full flex items-center justify-center ${filter.colorClasses} disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:shadow-none disabled:cursor-not-allowed transform hover:scale-105`}>
                              {isLoading && activeAiAction === filter.action ? ( <Loader small={true} /> ) : ( <> <FilterIcon className="w-5 h-5 mr-3" /> <span>{filter.name}</span> </>)}
                          </button>
                      ))}
                  </div>
                </div>
              )}
               {activeTool === 'ai-styles' && (
                <div className="flex flex-col space-y-4">
                  <div className="relative flex items-center">
                    <div className="flex-grow border-t border-gray-600"></div>
                    <span className="flex-shrink mx-4 text-gray-400 font-bold text-lg">Artistic AI Styles</span>
                    <div className="flex-grow border-t border-gray-600"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      {styles.map((style) => (
                          <button key={style.action} onClick={() => handleApplyStyle(style)} disabled={isLoading}
                              className={`w-full flex items-center justify-center text-center h-20 ${style.colorClasses} disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg text-base transition-all duration-300 shadow-md hover:shadow-lg disabled:shadow-none disabled:cursor-not-allowed transform hover:scale-105`}>
                              {isLoading && activeAiAction === style.action ? ( <Loader small={true} /> ) : ( <span>{style.name}</span> )}
                          </button>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Display Panel */}
        <div className="flex-grow bg-gray-800/50 p-6 rounded-lg border border-gray-700 shadow-lg shadow-fuchsia-500/10 flex flex-col justify-center items-center relative min-h-[400px] lg:min-h-0">
          {isLoading && <Loader />}
          {error && !isLoading && (
            <div className="text-center text-red-400 flex flex-col items-center">
              <AlertTriangleIcon className="w-12 h-12 mb-4" />
              <h3 className="text-xl font-bold mb-2">Error</h3>
              <p className="max-w-md">{error}</p>
            </div>
          )}
          {!isLoading && !error && (
            <ImageDisplay 
              originalImage={originalImage}
              editedImage={editedImage}
              editorState={currentEditorState}
              canvasRef={canvasRef}
              activeTool={activeTool}
              overlayImage={overlayImage}
              overlayConfig={overlayConfig}
              onOverlayConfigChange={setOverlayConfig}
              mergeConfig={mergeConfig}
              textObjects={textObjects}
              onTextUpdate={handleUpdateText}
              activeTextId={activeTextId}
              onActiveTextIdChange={setActiveTextId}
            />
          )}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end gap-4">
              {aiResponseText && !isLoading && (
                  <div className="flex-grow bg-black/70 p-3 rounded-md text-sm text-gray-300 border border-fuchsia-500/50 backdrop-blur-sm">
                      <p><span className="font-bold text-fuchsia-400">AI Note:</span> {aiResponseText}</p>
                  </div>
              )}
              {originalImage && !isLoading && (
                  <button onClick={openExportModal} className="flex-shrink-0 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3 px-5 rounded-lg flex items-center transition-all duration-300 shadow-lg shadow-fuchsia-500/30 transform hover:scale-105" aria-label="Export or Share edited image">
                      <DownloadIcon className="w-6 h-6 mr-2" />
                      <span>Export</span>
                  </button>
              )}
          </div>
        </div>
      </main>
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        canvasRef={canvasRef}
        originalName={originalImage?.name || 'image'}
      />
    </div>
  );
};

export default App;
