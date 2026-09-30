import React, { useState } from 'react';
import { X, Layers, Loader2, Download, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { ExtractedMedia, MediaFormat } from '../types/index.ts';

interface BatchDownloaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordDownload: (format: MediaFormat) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface BatchResultItem {
  url: string;
  success: boolean;
  data?: ExtractedMedia;
  error?: string;
}

export const BatchDownloaderModal: React.FC<BatchDownloaderModalProps> = ({
  isOpen,
  onClose,
  onRecordDownload,
  onShowToast,
}) => {
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<BatchResultItem[]>([]);

  if (!isOpen) return null;

  const handleStartBatch = async () => {
    const rawUrls = textInput
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.startsWith('http'));

    if (rawUrls.length === 0) {
      onShowToast('Please paste at least one valid video URL', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/batch-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: rawUrls })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        setResults(data.results);
        onShowToast(`Processed ${data.results.length} links!`, 'success');
      } else {
        onShowToast(data.error || 'Failed to process batch', 'error');
      }
    } catch {
      onShowToast('Batch processing request failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSingle = async (media: ExtractedMedia, format: MediaFormat) => {
    try {
      const cleanTitle = media.title.slice(0, 40).replace(/[^a-zA-Z0-9_\-]/g, '_');
      const filename = `${cleanTitle}_${format.quality.replace(/[^a-zA-Z0-9]/g, '')}`;
      const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(format.url)}&filename=${encodeURIComponent(filename)}&format=${format.format}&quality=${encodeURIComponent(format.quality)}`;

      onShowToast(`Downloading ${format.quality}...`, 'info');
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${filename}.${format.format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);

      onRecordDownload(format);
      onShowToast(`Saved: ${media.title.slice(0, 25)}...`, 'success');
    } catch {
      onShowToast('Batch item download failed', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Batch URL Downloader
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Paste multiple links (one per line) to parse all videos simultaneously
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Input Box */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Video URLs (Up to 10):
            </label>
            <textarea
              rows={4}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=...&#10;https://www.tiktok.com/@user/video/...&#10;https://www.instagram.com/reel/..."
              className="w-full p-3 text-xs sm:text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-rose-500 font-mono"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-neutral-500">
              {textInput.split('\n').filter((s) => s.trim().startsWith('http')).length} valid links detected
            </span>
            <button
              onClick={handleStartBatch}
              disabled={isLoading || !textInput.trim()}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Queue...</span>
                </>
              ) : (
                <>
                  <span>Extract All Links</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Results List */}
          {results.length > 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Extraction Results ({results.length})
              </h4>
              <div className="space-y-2">
                {results.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/50 flex items-center justify-between gap-3 text-xs"
                  >
                    {item.success && item.data ? (
                      <>
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.data.thumbnail}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover bg-neutral-900 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-neutral-900 dark:text-white truncate">
                              {item.data.title}
                            </p>
                            <p className="text-[11px] text-neutral-500 truncate">
                              {item.data.platformName} · {item.data.durationFormatted}
                            </p>
                          </div>
                        </div>

                        {/* Quick 1080p download button */}
                        {item.data.formats[0] && (
                          <button
                            onClick={() => handleDownloadSingle(item.data!, item.data!.formats[0])}
                            className="flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download HD</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-rose-500">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.url} - {item.error || 'Failed'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
