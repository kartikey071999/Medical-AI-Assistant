import React, { useCallback, useState, useRef, useEffect } from 'react';
import { UploadIcon, CameraIcon, XIcon } from './Icons';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string>('');

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndUpload(file);
    }
  }, [onFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  }, [onFileSelect]);

  const validateAndUpload = (file: File) => {
    const validTypes = [
      'image/jpeg', 'image/png', 'image/webp', 
      'application/pdf', 
      'text/csv', 'text/plain'
    ];
    
    if (validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      onFileSelect(file);
    } else {
      alert("Unsupported file format. Please upload JPG, PNG, PDF, CSV, or TXT.");
    }
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Could not access camera. Please allow permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            onFileSelect(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Upload Zone */}
      <label
        htmlFor="file-upload"
        className={`
          flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 relative overflow-hidden group
          ${isDragging 
            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' 
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-teal-400'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4 relative z-10">
          <div className="bg-teal-100 dark:bg-teal-900/40 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
            <UploadIcon className="w-8 h-8 text-teal-600 dark:text-teal-400" />
          </div>
          <p className="mb-2 text-xl font-semibold text-slate-700 dark:text-slate-200">
            Upload Report or Image
          </p>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Drag and drop or click to select
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-400 dark:text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity">
            <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">PDF</span>
            <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">JPG/PNG</span>
            <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">CSV</span>
          </div>
        </div>
        <input 
          id="file-upload" 
          type="file" 
          className="hidden" 
          accept="image/*,application/pdf,text/csv,text/plain,.csv"
          onChange={handleInputChange} 
        />
      </label>

      {/* Camera Button */}
      <button 
        onClick={startCamera}
        className="w-full py-4 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-center space-x-2 font-medium hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors shadow-sm hover:shadow-md"
      >
        <CameraIcon className="w-5 h-5" />
        <span>Open Camera / Take Photo</span>
      </button>

      {cameraError && (
        <p className="text-center text-red-500 text-sm">{cameraError}</p>
      )}

      {/* Full Screen Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black bg-opacity-95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <button 
            onClick={stopCamera}
            className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <XIcon className="w-8 h-8" />
          </button>

          <div className="w-full max-w-4xl relative rounded-2xl overflow-hidden shadow-2xl bg-black">
             <video 
               ref={videoRef} 
               autoPlay 
               playsInline 
               className="w-full h-auto max-h-[75vh] object-contain"
             ></video>
             
             <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent text-center">
                <p className="text-white font-medium drop-shadow-md">
                   Align document, wound, or X-ray in frame
                </p>
             </div>
          </div>

          <div className="mt-8">
            <button 
              onClick={captureImage}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-transparent hover:bg-white/10 transition-colors"
            >
              <div className="w-16 h-16 bg-white rounded-full"></div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
