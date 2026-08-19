import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, ExternalLink } from 'lucide-react';
import { getDriveMediaPlayerUrl } from '../utils/audioUtils';

interface ImageLightboxModalProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  title
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoomLevel(1);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = getDriveMediaPlayerUrl(images[currentIndex] || images[0]);

  const handlePrev = () => {
    setZoomLevel(1);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setZoomLevel(1);
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const toggleZoom = () => {
    setZoomLevel((prev) => (prev === 1 ? 1.8 : prev === 1.8 ? 2.5 : 1));
  };

  const handleOpenNewTab = () => {
    try {
      const win = window.open();
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title || 'Ảnh bài làm'}</title>
              <style>
                body { margin: 0; background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; color: #1e293b; font-family: sans-serif; }
                img { max-width: 100%; max-height: 100vh; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${currentImage}" alt="Full Image" />
            </body>
          </html>
        `);
        win.document.close();
      } else {
        window.open(currentImage, '_blank');
      }
    } catch (e) {
      window.open(currentImage, '_blank');
    }
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = currentImage;
      const cleanTitle = title ? title.replace(/[^a-zA-Z0-9_\-]/g, '_') : 'anh_bai_lam';
      link.download = `${cleanTitle}_trang_${currentIndex + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Lỗi khi tải ảnh:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-between p-2 sm:p-4 animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between text-slate-800 py-2 px-3 z-10 bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="font-bold text-sm text-teal-700 shrink-0">
            {images.length > 1 ? `Ảnh ${currentIndex + 1} / ${images.length}` : 'Xem ảnh'}
          </span>
          {title && <span className="text-xs text-slate-500 truncate border-l border-slate-200 pl-2">{title}</span>}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenNewTab}
            className="p-2 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition flex items-center gap-1.5 text-xs font-bold bg-white border border-slate-300 cursor-pointer"
            title="Mở ảnh trong thẻ mới để xem rõ hơn"
          >
            <ExternalLink className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Mở thẻ mới</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="p-2 hover:bg-teal-50 text-teal-700 hover:text-teal-800 rounded-lg transition flex items-center gap-1.5 text-xs font-bold bg-white border border-teal-300 cursor-pointer"
            title="Lưu ảnh về máy"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Tải về máy</span>
          </button>

          <button
            type="button"
            onClick={toggleZoom}
            className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600 hover:text-slate-900 flex items-center gap-1 text-xs font-semibold cursor-pointer"
            title="Phóng to / Thu nhỏ"
          >
            {zoomLevel > 1 ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            <span className="hidden sm:inline">{Math.round(zoomLevel * 100)}%</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-red-200 rounded-lg transition cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image View */}
      <div className="relative flex-1 w-full flex items-center justify-center my-2 overflow-auto">
        <img
          src={currentImage}
          alt={`Preview ${currentIndex + 1}`}
          style={{ transform: `scale(${zoomLevel})` }}
          className="max-h-[82vh] max-w-full object-contain transition-transform duration-200 select-none border border-slate-200 rounded-lg cursor-zoom-in"
          onClick={toggleZoom}
        />

        {/* Next / Prev Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-700 transition shadow-sm border border-slate-300"
              title="Ảnh trước"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-700 transition shadow-sm border border-slate-300"
              title="Ảnh tiếp theo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails strip at bottom if multiple images */}
      {images.length > 1 && (
        <div className="w-full max-w-2xl flex items-center justify-center gap-2 py-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setZoomLevel(1);
                setCurrentIndex(idx);
              }}
              className={`relative shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition ${
                idx === currentIndex ? 'border-teal-500 ring-2 ring-teal-200 scale-105' : 'border-slate-300 opacity-60 hover:opacity-100'
              }`}
            >
          <img src={getDriveMediaPlayerUrl(img)} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
