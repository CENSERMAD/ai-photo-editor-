import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { ImageIcon } from './icons';
import { EditorState, ImageData, OverlayConfig, MergeConfig, TextObject } from '../App';

type ActiveTool = 'adjust' | 'ai-filters' | 'ai-tools' | 'effects' | 'ai-styles' | 'merge' | 'text';

interface ImageDisplayProps {
  originalImage: ImageData | null;
  editedImage: string | null;
  editorState: EditorState;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  activeTool: ActiveTool;
  overlayImage: ImageData | null;
  overlayConfig: OverlayConfig;
  onOverlayConfigChange: (config: OverlayConfig) => void;
  mergeConfig: MergeConfig;
  textObjects: TextObject[];
  onTextUpdate: (text: TextObject) => void;
  activeTextId: string | null;
  onActiveTextIdChange: (id: string | null) => void;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ 
    originalImage, editedImage, editorState, canvasRef,
    activeTool, overlayImage, overlayConfig, onOverlayConfigChange, mergeConfig,
    textObjects, onTextUpdate, activeTextId, onActiveTextIdChange
}) => {
  const imageRef = useRef<HTMLImageElement>(new Image());
  const overlayImageRef = useRef<HTMLImageElement | null>(null);

  // Off-screen canvas for the mask
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Refs for interaction state
  const isInteracting = useRef(false);
  const interactionType = useRef<'move-overlay' | 'draw-mask' | 'move-text' | 'none'>('none');
  const lastPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Initialize mask when overlay is added
  useEffect(() => {
    if (overlayImage && canvasRef.current) {
        if (!maskCanvasRef.current) {
            maskCanvasRef.current = document.createElement('canvas');
        }
        maskCanvasRef.current.width = canvasRef.current.width;
        maskCanvasRef.current.height = canvasRef.current.height;
        const maskCtx = maskCanvasRef.current.getContext('2d');
        if (maskCtx) {
            // Start with a fully visible overlay
            maskCtx.fillStyle = 'white';
            maskCtx.fillRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
        }
    } else {
        maskCanvasRef.current = null;
    }
  }, [overlayImage, canvasRef.current?.width, canvasRef.current?.height]);

  useLayoutEffect(() => {
    const mainCanvas = canvasRef.current;
    if (!mainCanvas || !originalImage) return;

    const mainCtx = mainCanvas.getContext('2d', { willReadFrequently: true });
    if (!mainCtx) return;

    const baseImg = imageRef.current;
    let isMounted = true;

    baseImg.onload = () => {
        if (!isMounted) return;

        // Base image adjustments
        const { rotation, flipH } = editorState.transform;
        const { brightness, contrast, saturate, hue, blur } = editorState.adjustments;
        const { preset, vignette, noise } = editorState.effects;

        if (rotation === 90 || rotation === 270) {
            mainCanvas.width = baseImg.height;
            mainCanvas.height = baseImg.width;
        } else {
            mainCanvas.width = baseImg.width;
            mainCanvas.height = baseImg.height;
        }

        mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
        
        // --- Draw Base Layer ---
        mainCtx.save();
        mainCtx.translate(mainCanvas.width / 2, mainCanvas.height / 2);
        mainCtx.rotate(rotation * Math.PI / 180);
        mainCtx.scale(flipH ? -1 : 1, 1);
        
        let filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) hue-rotate(${hue}deg) blur(${blur}px)`;
        if (preset === 'sepia') filterString += ' sepia(100%)';
        if (preset === 'grayscale') filterString += ' grayscale(100%)';
        if (preset === 'invert') filterString += ' invert(100%)';
        mainCtx.filter = filterString;
        
        mainCtx.drawImage(baseImg, -baseImg.width / 2, -baseImg.height / 2);
        mainCtx.restore();
        
        // --- Draw Overlay Layer ---
        if (overlayImage && overlayImageRef.current && overlayImageRef.current.complete) {
            // ... (overlay drawing logic remains the same)
        }

        // --- Draw Text Layer ---
        textObjects.forEach(textObj => {
            mainCtx.save();
            mainCtx.font = `${textObj.fontStyle} ${textObj.fontWeight} ${textObj.size}px ${textObj.font}`;
            mainCtx.fillStyle = textObj.color;
            mainCtx.textAlign = 'center';
            mainCtx.textBaseline = 'middle';
            mainCtx.fillText(textObj.text, textObj.x, textObj.y);

            const metrics = mainCtx.measureText(textObj.text);
            const textWidth = metrics.width;
            
            // Draw underline if needed
            if (textObj.textDecoration === 'underline') {
                const startX = textObj.x - textWidth / 2;
                const endX = textObj.x + textWidth / 2;
                const yPos = textObj.y + textObj.size / 2; // Position underline at the bottom
                
                mainCtx.beginPath();
                mainCtx.moveTo(startX, yPos);
                mainCtx.lineTo(endX, yPos);
                mainCtx.strokeStyle = textObj.color;
                mainCtx.lineWidth = Math.max(1, Math.floor(textObj.size / 20)); // Proportional thickness
                mainCtx.stroke();
            }

            // Draw selection box for active text
            if (textObj.id === activeTextId) {
                const textHeight = textObj.size; // Approximation
                mainCtx.strokeStyle = '#06b6d4';
                mainCtx.lineWidth = 2;
                mainCtx.strokeRect(textObj.x - textWidth / 2 - 5, textObj.y - textHeight / 2 - 5, textWidth + 10, textHeight + 10);
            }
            mainCtx.restore();
        });

        // --- Post Effects (Vignette, Noise) ---
        if (vignette > 0) {
            // Vignette logic...
        }
        if (noise > 0) {
            // Noise logic...
        }
    };
    
    // Set base image source
    baseImg.src = `data:${originalImage.mimeType};base64,${originalImage.base64}`;
    
    // Set overlay image source
    if (overlayImage) {
        if (!overlayImageRef.current) {
            overlayImageRef.current = new Image();
            overlayImageRef.current.onload = () => { /* trigger re-render */ };
        }
        overlayImageRef.current.src = `data:${overlayImage.mimeType};base64,${overlayImage.base64}`;
    } else {
        overlayImageRef.current = null;
    }

    return () => { isMounted = false; };

  }, [originalImage, editorState, canvasRef, overlayImage, overlayConfig, textObjects, activeTextId]);

  // Interaction Effect for Merge & Text Tools
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.style.cursor = 'default'; // Reset cursor
    if (activeTool === 'merge' && overlayImage) {
        if (mergeConfig.tool === 'move') canvas.style.cursor = 'grab';
        else canvas.style.cursor = 'crosshair';
    } else if (activeTool === 'text') {
        canvas.style.cursor = 'text';
    }

    const getCoords = (e: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) / rect.width * canvas.width,
            y: (clientY - rect.top) / rect.height * canvas.height
        };
    };
    
    const getTextObjectAt = (x: number, y: number): TextObject | null => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        // Iterate backwards to select top-most text
        for (let i = textObjects.length - 1; i >= 0; i--) {
            const obj = textObjects[i];
            ctx.font = `${obj.fontStyle} ${obj.fontWeight} ${obj.size}px ${obj.font}`;
            const metrics = ctx.measureText(obj.text);
            const width = metrics.width;
            const height = obj.size;
            
            if ( x >= obj.x - width / 2 && x <= obj.x + width / 2 &&
                 y >= obj.y - height / 2 && y <= obj.y + height / 2 ) {
                return obj;
            }
        }
        return null;
    };


    const handleStart = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        const coords = getCoords(e);
        lastPosition.current = coords;
        isInteracting.current = true;
        
        if (activeTool === 'merge' && overlayImage) {
            if (mergeConfig.tool === 'move') {
                interactionType.current = 'move-overlay';
                if(canvas) canvas.style.cursor = 'grabbing';
            } else {
                interactionType.current = 'draw-mask';
            }
        } else if (activeTool === 'text') {
            const clickedText = getTextObjectAt(coords.x, coords.y);
            onActiveTextIdChange(clickedText ? clickedText.id : null);
            if (clickedText) {
                interactionType.current = 'move-text';
                dragStartOffset.current = { x: clickedText.x - coords.x, y: clickedText.y - coords.y };
                if (canvas) canvas.style.cursor = 'move';
            }
        }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
        if (!isInteracting.current) return;
        e.preventDefault();
        const coords = getCoords(e);
        
        if (interactionType.current === 'move-overlay') {
             const dx = coords.x - lastPosition.current.x;
             const dy = coords.y - lastPosition.current.y;
             onOverlayConfigChange({ ...overlayConfig, x: overlayConfig.x + dx, y: overlayConfig.y + dy });
        } else if (interactionType.current === 'draw-mask') {
            const maskCtx = maskCanvasRef.current?.getContext('2d');
            if (!maskCtx) return;
            
            maskCtx.beginPath();
            maskCtx.moveTo(lastPosition.current.x, lastPosition.current.y);
            maskCtx.lineTo(coords.x, coords.y);
            maskCtx.lineWidth = mergeConfig.brushSize;
            maskCtx.lineCap = 'round';
            maskCtx.lineJoin = 'round';
            
            if (mergeConfig.tool === 'eraser') maskCtx.globalCompositeOperation = 'destination-out';
            else {
                maskCtx.globalCompositeOperation = 'source-over';
                maskCtx.strokeStyle = 'white';
            }
            maskCtx.stroke();
            onOverlayConfigChange({ ...overlayConfig });
        } else if (interactionType.current === 'move-text') {
            const activeText = textObjects.find(t => t.id === activeTextId);
            if (activeText) {
                onTextUpdate({ ...activeText, x: coords.x + dragStartOffset.current.x, y: coords.y + dragStartOffset.current.y });
            }
        }
        lastPosition.current = coords;
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        isInteracting.current = false;
        interactionType.current = 'none';
        if (activeTool === 'merge' && mergeConfig.tool === 'move' && canvas) canvas.style.cursor = 'grab';
        if (activeTool === 'text' && canvas) canvas.style.cursor = 'text';
    };

    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseleave', handleEnd);
    // Touch events
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd);

    return () => {
        canvas.removeEventListener('mousedown', handleStart);
        canvas.removeEventListener('mousemove', handleMove);
        canvas.removeEventListener('mouseup', handleEnd);
        canvas.removeEventListener('mouseleave', handleEnd);
        canvas.removeEventListener('touchstart', handleStart);
        canvas.removeEventListener('touchmove', handleMove);
        canvas.removeEventListener('touchend', handleEnd);
        canvas.style.cursor = 'default';
    };
  }, [activeTool, overlayImage, mergeConfig, overlayConfig, onOverlayConfigChange, textObjects, activeTextId, onActiveTextIdChange, onTextUpdate]);


  if (editedImage) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-full h-full relative">
                <img
                    src={editedImage}
                    alt="AI Edited Vision"
                    className="object-contain w-full h-full max-h-[70vh] rounded-lg shadow-lg shadow-black/50"
                />
                <div className="absolute top-2 right-2 px-3 py-1 text-sm font-bold rounded-full text-white bg-fuchsia-600">
                    Edited Vision
                </div>
            </div>
        </div>
    );
  }

  if (!originalImage) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-500">
        <ImageIcon className="w-24 h-24 mb-4" />
        <p className="text-lg">Your image will appear here.</p>
        <p className="text-sm">Start by uploading a photo.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="w-full h-full relative">
            <canvas
                ref={canvasRef}
                className="object-contain w-full h-full max-h-[70vh] rounded-lg shadow-lg shadow-black/50"
            />
            <div className="absolute top-2 right-2 px-3 py-1 text-sm font-bold rounded-full text-white bg-cyan-600">
                Live Preview
            </div>
        </div>
    </div>
  );
};

export default ImageDisplay;
