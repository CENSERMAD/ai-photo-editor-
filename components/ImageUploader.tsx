
import React, { useRef } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/'))) {
      onImageUpload(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        disabled={isLoading}
      />
      <label
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`w-full h-full flex flex-col items-center justify-center border-4 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer transition-all duration-300 hover:border-cyan-500 hover:bg-gray-700/50 ${isLoading ? 'cursor-wait' : ''}`}
      >
        <UploadIcon className="w-16 h-16 text-gray-400 mb-4 transition-transform duration-300 group-hover:scale-110" />
        <h2 className="text-xl font-bold text-cyan-300 mb-2">1. Upload Your Image</h2>
        <p className="text-gray-400">
          Drag & Drop or{' '}
          <span className="text-cyan-400 font-semibold">Click to browse</span>
        </p>
        <p className="text-xs text-gray-500 mt-4">PNG, JPG, WEBP accepted</p>
      </label>
    </div>
  );
};

export default ImageUploader;
