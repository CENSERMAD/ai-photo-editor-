
import React, { useState, useCallback } from 'react';
import { editImageWithGemini } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import ImageDisplay from './components/ImageDisplay';
import Loader from './components/Loader';
import { SparklesIcon, AlertTriangleIcon } from './components/icons';

interface ImageData {
  base64: string;
  mimeType: string;
  name: string;
}

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResponseText, setAiResponseText] = useState<string | null>(null);

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

  const handleGenerate = async () => {
    if (!originalImage || !prompt) {
      setError('Please upload an image and provide an editing prompt.');
      return;
    }
    setError(null);
    setEditedImage(null);
    setAiResponseText(null);
    setIsLoading(true);

    try {
      const result = await editImageWithGemini(originalImage.base64, originalImage.mimeType, prompt);
      if (result.imageUrl) {
        setEditedImage(`data:image/png;base64,${result.imageUrl}`);
      } else {
        setError("The AI didn't return an image. It might have refused the request.");
      }
      setAiResponseText(result.text);
    } catch (e: any) {
      setError(`An error occurred: ${e.message}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    setOriginalImage(null);
    setEditedImage(null);
    setPrompt('');
    setError(null);
    setAiResponseText(null);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8 flex flex-col">
      <header className="text-center mb-8 border-b-2 border-cyan-500/30 pb-4">
        <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400 tracking-wider" style={{ textShadow: '0 0 10px #06b6d4, 0 0 20px #0891b2' }}>
          AI Photo Editor // Future Vision
        </h1>
        <p className="text-lg text-gray-400 mt-2">Transform your images with futuristic AI prompts.</p>
      </header>
      
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Control Panel */}
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 shadow-lg shadow-cyan-500/10 flex flex-col space-y-6">
          <div className="flex-grow flex flex-col">
            {!originalImage && <ImageUploader onImageUpload={handleImageUpload} isLoading={isLoading} />}
            {originalImage && (
              <div className="flex flex-col space-y-4 flex-grow">
                 <div className="flex justify-between items-center bg-gray-900 p-3 rounded-md">
                    <p className="text-gray-300 truncate pr-4">Loaded: <span className="font-semibold text-cyan-400">{originalImage.name}</span></p>
                    <button onClick={handleReset} className="text-sm bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded transition-colors duration-200">
                      Reset
                    </button>
                </div>
                <div>
                  <label htmlFor="prompt" className="block text-lg font-semibold mb-2 text-cyan-300">
                    2. Your Vision (The Prompt)
                  </label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., 'Add a neon-lit cyberpunk city in the background', 'Change my clothes to a futuristic silver jacket', 'Make it look like a scene from Blade Runner'"
                    className="w-full h-40 bg-gray-900 border-2 border-gray-600 rounded-md p-3 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 placeholder-gray-500 resize-none"
                    disabled={isLoading}
                  />
                </div>
                <div className="mt-auto pt-4">
                  <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt}
                    className="w-full flex items-center justify-center bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:shadow-none disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
                  >
                    {isLoading ? (
                      <>
                        <Loader small={true}/>
                        <span className="ml-2">Transforming Reality...</span>
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-6 h-6 mr-2" />
                        Generate
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Display Panel */}
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 shadow-lg shadow-fuchsia-500/10 flex flex-col justify-center items-center relative min-h-[400px] lg:min-h-0">
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
              originalImage={originalImage ? `data:${originalImage.mimeType};base64,${originalImage.base64}` : null}
              editedImage={editedImage}
            />
          )}
           {aiResponseText && !isLoading && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/70 p-3 rounded-md text-sm text-gray-300 border border-fuchsia-500/50 backdrop-blur-sm">
                <p><span className="font-bold text-fuchsia-400">AI Note:</span> {aiResponseText}</p>
              </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default App;
