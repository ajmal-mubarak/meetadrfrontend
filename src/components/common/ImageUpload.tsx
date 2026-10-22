import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, RefreshCw } from 'lucide-react';

interface ImageUploadProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  onRemove?: () => void;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  maxDimension?: number;
  quality?: number;
  aspectRatio?: 'video' | 'square' | 'wide' | 'auto';
  className?: string;
}

/**
 * Compresses an image file client-side to a performant base64 Data URL.
 */
const compressImage = (file: File, maxDim = 1200, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Use JPEG for photographic balance, or preserve PNG for transparent files
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label = 'Facility Photo / Image',
  value,
  onChange,
  onRemove,
  helperText = 'Supported formats: JPG, PNG, WebP (Max 10MB)',
  disabled = false,
  maxDimension = 1200,
  quality = 0.85,
  aspectRatio = 'wide',
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image file size must be less than 10MB.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    try {
      const dataUrl = await compressImage(file, maxDimension, quality);
      onChange(dataUrl);
    } catch (err) {
      console.error('Image compression failed:', err);
      setError('Failed to process the image. Please try a different photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isProcessing) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
    // Reset so selecting the same file again triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    } else {
      onChange('');
    }
    setError(null);
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square max-w-[200px]';
      case 'video':
        return 'aspect-video';
      case 'wide':
      default:
        return 'aspect-[16/9] sm:aspect-[21/9] max-h-48';
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-[#2DA7B5]" />
            <span>{label}</span>
          </span>
          {value && !disabled && (
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Photo uploaded
            </span>
          )}
        </label>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        disabled={disabled || isProcessing}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {value ? (
        /* Image Preview Box */
        <div
          className={`relative group rounded-2xl overflow-hidden border border-[#E2EBF0] bg-slate-100 shadow-xs ${getAspectRatioClass()}`}
        >
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={() => setError('Image failed to render. Please choose a different file.')}
          />

          {/* Action Overlay */}
          {!disabled && (
            <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-3.5 py-2 bg-white text-slate-800 hover:bg-slate-100 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>Change Image</span>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isProcessing}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && !isProcessing && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 transition-all text-center flex flex-col items-center justify-center cursor-pointer select-none ${
            isDragging
              ? 'border-[#2DA7B5] bg-[#2DA7B5]/10 scale-[0.99]'
              : 'border-[#CBD5E1] bg-[#F8FAFC] hover:bg-white hover:border-[#2DA7B5]/60'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-white border border-[#E2EBF0] shadow-xs flex items-center justify-center text-[#2DA7B5] mb-2.5">
            {isProcessing ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <p className="text-xs font-bold text-slate-800">
            {isProcessing ? 'Processing Image...' : 'Click to upload image or drag & drop'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
            {helperText}
          </p>

          <button
            type="button"
            disabled={disabled || isProcessing}
            className="mt-3 px-3.5 py-1.5 bg-white border border-[#CBD5E1] hover:border-[#2DA7B5] hover:text-[#2DA7B5] text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#2DA7B5]" />
            <span>Select Image File</span>
          </button>
        </div>
      )}

      {error && (
        <p className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};
