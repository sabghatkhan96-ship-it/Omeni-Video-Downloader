import React, { useEffect, useRef } from 'react';
import { X, Smartphone, Copy, Check, Download } from 'lucide-react';
import QRCode from 'qrcode';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUrl: string;
  title: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  targetUrl,
  title,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current && targetUrl) {
      QRCode.toCanvas(
        canvasRef.current,
        targetUrl,
        {
          width: 240,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        },
        (error) => {
          if (error) console.error('QR code generation error:', error);
        }
      );
    }
  }, [isOpen, targetUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xl text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <Smartphone className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
          Scan to Download on Phone
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto line-clamp-1">
          {title}
        </p>

        {/* QR Code Canvas */}
        <div className="my-5 p-3 bg-white rounded-xl shadow-inner inline-block border border-neutral-200">
          <canvas ref={canvasRef} className="rounded-lg" />
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          Open Camera app on your iPhone or Android and scan this code to save the file instantly.
        </p>

        <div className="mt-5 flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
