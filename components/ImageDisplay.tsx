
import React from 'react';
import { ImageIcon } from './icons';

interface ImageDisplayProps {
  originalImage: string | null;
  editedImage: string | null;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ originalImage, editedImage }) => {
  const displayImage = editedImage || originalImage;

  if (!displayImage) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-500">
        <ImageIcon className="w-24 h-24 mb-4" />
        <p className="text-lg">Your generated image will appear here.</p>
        <p className="text-sm">Start by uploading a photo.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
      <div className="w-full h-full relative">
        <img
          src={displayImage}
          alt={editedImage ? "AI Edited" : "Original Upload"}
          className="object-contain w-full h-full max-h-[70vh] rounded-lg shadow-lg shadow-black/50"
        />
        <div className={`absolute top-2 right-2 px-3 py-1 text-sm font-bold rounded-full text-white ${editedImage ? 'bg-fuchsia-600' : 'bg-cyan-600'}`}>
          {editedImage ? 'Edited Vision' : 'Original'}
        </div>
      </div>
    </div>
  );
};

export default ImageDisplay;
