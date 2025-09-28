import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DownloadIcon, ShareIcon, XIcon } from './icons';
import Slider from './Slider';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  originalName: string;
}

type ExportFormat = 'png' | 'jpeg' | 'webp';

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, canvasRef, originalName }) => {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState(90);
  const [canShare, setCanShare] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const getFileName = (format: ExportFormat) => {
    const nameParts = originalName.split('.');
    if (nameParts.length > 1) {
        nameParts.pop();
    }
    const safeName = nameParts.join('.') || 'image';
    return `${safeName}_edited.${format}`;
  };

  useEffect(() => {
    // Check for Web Share API support
    if (navigator.share && navigator.canShare) {
      setCanShare(true);
    }
  }, []);

  const generateExportableDataURL = useCallback(async (): Promise<string> => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error("Canvas not available");

    const mimeType = `image/${format}`;
    if (format === 'png') {
        return canvas.toDataURL(mimeType);
    }
    return canvas.toDataURL(mimeType, quality / 100);
  }, [canvasRef, format, quality]);


  const handleDownload = async () => {
    if (!canvasRef.current) return;
    setIsProcessing(true);
    try {
        const dataUrl = await generateExportableDataURL();
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = getFileName(format);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Failed to download image", e);
    } finally {
        setIsProcessing(false);
    }
  };
  
  const dataURLtoFile = (dataurl: string, filename: string): File | null => {
      const arr = dataurl.split(',');
      if (arr.length < 2) return null;
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch) return null;
      const mime = mimeMatch[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while(n--){
          u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, {type:mime});
  }

  const handleShare = async () => {
    if (!canvasRef.current || !navigator.share) return;
    setIsProcessing(true);
    try {
        const dataUrl = await generateExportableDataURL();
        const file = dataURLtoFile(dataUrl, getFileName(format));
        if (file && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'Edited Image',
                text: `Check out this image I edited with AI Photo Editor!`,
            });
        } else {
            console.error("Sharing not supported for this file type.");
            // Fallback for browsers that can't share files (e.g., desktop)
            if (navigator.canShare({ title: 'Edited Image' })) {
                await navigator.share({ title: 'Edited Image', text: 'Check out the image I edited!' });
            }
        }
    } catch (e) {
        // Catch user cancellation of share dialog
        if (e instanceof Error && e.name !== 'AbortError') {
             console.error("Error sharing image:", e);
        }
    } finally {
        setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl shadow-cyan-500/20 w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyan-400" id="export-modal-title">Export & Share</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close export dialog">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-6">
            <div>
              <label className="block text-lg font-semibold mb-3 text-gray-300">Format</label>
              <div className="grid grid-cols-3 gap-3">
                {(['png', 'jpeg', 'webp'] as ExportFormat[]).map(f => (
                  <button key={f} onClick={() => setFormat(f)} className={`py-2 px-4 rounded-lg font-semibold transition-all ${format === f ? 'bg-cyan-500 text-white shadow-md' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {(format === 'jpeg' || format === 'webp') && (
              <div>
                <Slider label="Quality" value={quality} min={10} max={100} onChange={(v, _) => setQuality(v)} />
              </div>
            )}

            <div className="pt-4 space-y-3">
              <button 
                onClick={handleDownload}
                disabled={isProcessing}
                className="w-full flex items-center justify-center bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3 px-5 rounded-lg transition-all duration-300 shadow-lg shadow-fuchsia-500/30 transform hover:scale-105 disabled:bg-gray-600 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed">
                <DownloadIcon className="w-6 h-6 mr-2" />
                <span>{isProcessing ? 'Processing...' : 'Download'}</span>
              </button>
              {canShare && (
                <button 
                    onClick={handleShare}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-5 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:bg-gray-600 disabled:transform-none disabled:cursor-not-allowed">
                    <ShareIcon className="w-6 h-6 mr-2" />
                    <span>{isProcessing ? 'Preparing...' : 'Share'}</span>
                </button>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
