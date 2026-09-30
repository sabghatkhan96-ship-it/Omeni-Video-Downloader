import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { HeroInput } from './components/HeroInput.tsx';
import { PlatformStrip } from './components/PlatformStrip.tsx';
import { MediaResultCard } from './components/MediaResultCard.tsx';
import { HowItWorks } from './components/HowItWorks.tsx';
import { FeaturesBento } from './components/FeaturesBento.tsx';
import { FAQSection } from './components/FAQSection.tsx';
import { Footer } from './components/Footer.tsx';
import { QRCodeModal } from './components/QRCodeModal.tsx';
import { BatchDownloaderModal } from './components/BatchDownloaderModal.tsx';
import { HistoryDrawer } from './components/HistoryDrawer.tsx';
import { ExtractedMedia, HistoryItem, MediaFormat, ToastMessage } from './types/index.ts';
import { sanitizeVideoUrl, extractClientSide } from './utils/clientExtractor.ts';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('omnistream_theme');
      if (saved) return saved === 'dark';
    }
    return true; // Default dark mode for modern high-contrast aesthetic
  });

  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedMedia, setExtractedMedia] = useState<ExtractedMedia | null>(null);

  // Modals & Drawers
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: ''
  });

  // History state persisted in localStorage
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('omnistream_history');
        if (saved) return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync dark class on <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('omnistream_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('omnistream_theme', 'light');
    }
  }, [darkMode]);

  // Persist history changes
  useEffect(() => {
    try {
      localStorage.setItem('omnistream_history', JSON.stringify(history));
    } catch {
      // storage full or disabled
    }
  }, [history]);

  // Toast helper
  const showToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Extract video details
  const handleExtract = async (targetUrl?: string) => {
    const rawInput = (targetUrl || url).trim();
    if (!rawInput) {
      setErrorMessage('Please enter a valid video link');
      return;
    }

    const cleanUrl = sanitizeVideoUrl(rawInput);
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      setErrorMessage('Please enter a valid URL (e.g., youtube.com/watch?v=...)');
      return;
    }

    // Update input display with clean URL
    setUrl(cleanUrl);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      let mediaData: ExtractedMedia | null = null;

      // 1. First attempt backend extraction
      try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: cleanUrl }),
        });

        const textResponse = await res.text();
        if (res.ok) {
          try {
            const json = JSON.parse(textResponse);
            if (json.success && json.data) {
              mediaData = json.data;
            }
          } catch {
            // Server returned non-JSON (e.g. cookie redirect or HTML)
          }
        }
      } catch (backendErr) {
        console.warn('Backend extract request failed, using instant client fallback:', backendErr);
      }

      // 2. If backend didn't return media (e.g. cloud rate limit, HTML page), use instant client extractor
      if (!mediaData) {
        mediaData = await extractClientSide(cleanUrl);
      }

      setExtractedMedia(mediaData);
      showToast('Video information extracted successfully!', 'success');

      // Smooth scroll to result
      setTimeout(() => {
        window.scrollTo({
          top: 320,
          behavior: 'smooth'
        });
      }, 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse video';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Record a download in local history
  const handleRecordDownload = (format: MediaFormat) => {
    if (!extractedMedia) return;

    const newItem: HistoryItem = {
      id: Math.random().toString(36).slice(2),
      title: extractedMedia.title,
      thumbnail: extractedMedia.thumbnail,
      author: extractedMedia.author,
      platform: extractedMedia.platformName,
      originalUrl: extractedMedia.originalUrl,
      downloadedAt: Date.now(),
      formatDownloaded: `${format.quality} (${format.format.toUpperCase()})`
    };

    setHistory((prev) => [newItem, ...prev.filter((h) => h.originalUrl !== extractedMedia.originalUrl)].slice(0, 30));
  };

  const handleClearHistory = () => {
    setHistory([]);
    showToast('Download history cleared', 'info');
  };

  const handleClearInput = () => {
    setUrl('');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      {/* Navbar */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenBatch={() => setIsBatchOpen(true)}
        historyCount={history.length}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero & Input Section */}
        <HeroInput
          url={url}
          setUrl={setUrl}
          onExtract={handleExtract}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onClear={handleClearInput}
        />

        {/* Media Results Card (When Video is Extracted) */}
        {extractedMedia && (
          <MediaResultCard
            media={extractedMedia}
            onShowQR={(linkUrl, title) => setQrModal({ isOpen: true, url: linkUrl, title })}
            onRecordDownload={handleRecordDownload}
            onShowToast={showToast}
          />
        )}

        {/* Supported Platforms Strip */}
        <PlatformStrip />

        {/* How It Works Guide */}
        <HowItWorks />

        {/* Features Bento */}
        <FeaturesBento />

        {/* Frequently Asked Questions */}
        <FAQSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* QR Code Modal for Mobile Beam */}
      <QRCodeModal
        isOpen={qrModal.isOpen}
        onClose={() => setQrModal({ isOpen: false, url: '', title: '' })}
        targetUrl={qrModal.url}
        title={qrModal.title}
      />

      {/* Batch Downloader Modal */}
      <BatchDownloaderModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        onRecordDownload={handleRecordDownload}
        onShowToast={showToast}
      />

      {/* Recent History Slide-over Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
        onSelectUrl={(selectedUrl) => {
          setUrl(selectedUrl);
          handleExtract(selectedUrl);
        }}
      />

      {/* Toast Notifications Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl shadow-lg border flex items-center justify-between gap-3 text-xs sm:text-sm animate-fadeIn ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-800 text-rose-200'
                : 'bg-neutral-900/90 border-neutral-800 text-white'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              )}
              <span className="truncate">{toast.message}</span>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
