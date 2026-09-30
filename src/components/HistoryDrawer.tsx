import React from 'react';
import { X, History, Trash2, Download, ExternalLink } from 'lucide-react';
import { HistoryItem } from '../types/index.ts';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onClearHistory: () => void;
  onSelectUrl: (url: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onSelectUrl,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md h-full bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 flex flex-col shadow-2xl animate-slideLeft">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Download History
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {history.length} items saved locally
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

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
              <History className="w-12 h-12 mb-3 stroke-1 text-neutral-300 dark:text-neutral-700" />
              <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                No downloads yet
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs">
                Videos and audios you extract and download will appear here for fast re-access.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const dateStr = new Date(item.downloadedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/50 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.thumbnail}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover bg-neutral-900 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-neutral-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {item.platform} · {item.formatDownloaded} · {dateStr}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSelectUrl(item.originalUrl);
                      onClose();
                    }}
                    className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors shrink-0"
                    title="Load link again"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/50 flex items-center justify-between">
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90"
            >
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
