'use client';

import { useState, useCallback, useRef } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Camera, Upload } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';

interface ImageCropperProps {
  currentImage?: string | null;
  onImageChange: (croppedImageDataUrl: string) => void;
  aspectRatio?: number;
  maxSizeKB?: number;
  quality?: number;
  translationPrefix?: string;
}

interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Helper function to create image from URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

// Helper function to get cropped image as data URL
const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: CroppedAreaPixels,
  quality: number = 0.8,
  maxSizeKB: number = 500
): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Set canvas size to the cropped area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Resize if the image is too large (max 400x400 for profile pictures)
  const maxDimension = 400;
  let finalWidth = pixelCrop.width;
  let finalHeight = pixelCrop.height;

  if (finalWidth > maxDimension || finalHeight > maxDimension) {
    const scale = Math.min(maxDimension / finalWidth, maxDimension / finalHeight);
    finalWidth = Math.round(finalWidth * scale);
    finalHeight = Math.round(finalHeight * scale);

    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = finalWidth;
    resizedCanvas.height = finalHeight;
    const resizedCtx = resizedCanvas.getContext('2d');
    
    if (resizedCtx) {
      resizedCtx.drawImage(canvas, 0, 0, finalWidth, finalHeight);
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      ctx.drawImage(resizedCanvas, 0, 0);
    }
  }

  // Compress by adjusting quality until size is under limit
  let currentQuality = quality;
  let dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
  
  // Check size and reduce quality if needed
  while (dataUrl.length > maxSizeKB * 1024 * 1.37 && currentQuality > 0.1) {
    currentQuality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
  }

  return dataUrl;
};

export default function ImageCropper({
  currentImage,
  onImageChange,
  aspectRatio = 1,
  maxSizeKB = 500,
  quality = 0.8,
  translationPrefix = 'settings',
}: ImageCropperProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  // Cropper state
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return;
      }

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
        setIsModalOpen(true);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      });
      reader.readAsDataURL(file);
    }
    
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle crop complete
  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Apply crop and close modal
  const handleApplyCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        quality,
        maxSizeKB
      );
      onImageChange(croppedImage);
      setIsModalOpen(false);
      setImageSrc(null);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Cancel and close modal
  const handleCancel = () => {
    setIsModalOpen(false);
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  // Reset zoom
  const handleResetZoom = () => {
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  return (
    <>
      {/* Profile Picture Display */}
      <div className="flex items-center gap-6">
        <div className="relative">
          {currentImage ? (
            <img
              src={currentImage}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" />
            </div>
          )}
          
          {/* Upload button overlay */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2 bg-amber-500 rounded-full text-white hover:bg-amber-600 transition-colors shadow-lg cursor-pointer"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        
        <div>
          <h3 className="font-medium text-gray-900">
            {t(`${translationPrefix}.profilePicture`) || 'Profile Picture'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t(`${translationPrefix}.profilePictureDesc`) || 'JPG, GIF or PNG. Max size of 2MB.'}
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Cropper Modal */}
      <AnimatePresence>
        {isModalOpen && imageSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t(`${translationPrefix}.cropImage`) || 'Crop Image'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Cropper Area */}
              <div className="relative h-80 bg-gray-900">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspectRatio}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  cropShape="round"
                  showGrid={false}
                />
              </div>

              {/* Zoom Controls */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <ZoomOut className="w-5 h-5 text-gray-400" />
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <ZoomIn className="w-5 h-5 text-gray-400" />
                  <button
                    onClick={handleResetZoom}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                    title={t(`${translationPrefix}.resetZoom`) || 'Reset Zoom'}
                  >
                    <RotateCcw className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors cursor-pointer"
                >
                  {t(`${translationPrefix}.cancel`) || 'Cancel'}
                </button>
                <button
                  onClick={handleApplyCrop}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  {t(`${translationPrefix}.applyCrop`) || 'Apply'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
