import React, { useState, useEffect } from 'react';
import {
  Link2,
  Clipboard,
  X,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Play,
  Youtube,
  Instagram,
  Twitter,
  Music2,
  Share2
} from 'lucide-react';

interface HeroInputProps {
  url: string;
  setUrl: (url: string) => void;
  onExtract: (targetUrl?: string) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
  onClear: () => void;
}

export const HeroInput: React.FC<HeroInputProps> = ({
  url,
  setUrl,
  onExtract,
  isLoading,
  errorMessage,
  onClear,
}) => {
  const [pasteSuccess, setPasteSuccess] = useState(false);

  // Auto-detect platform icon from current input
  const getDetectedIcon = () => {
    const val = url.toLowerCase();
    if (val.includes('youtube') || val.includes('youtu.be')) return <Youtube className="w-5 h-5 text-red-500" />;
    if (val.includes('tiktok')) return <Music2 className="w-5 h-5 text-pink-500" />;
    if (val.includes('instagram')) return <Instagram className="w-5 h-5 text-rose-500" />;
    if (val.includes('twitter') || val.includes('x.com')) return <Twitter className="w-5 h-5 text-sky-400" />;
    if (val.includes('facebook') || val.includes('fb.watch')) return <Share2 className="w-5 h-5 text-blue-600" />;
    return <Link2 className="w-5 h-5 text-neutral-400" />;
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().startsWith('http')) {
          setUrl(text.trim());
          setPasteSuccess(true);
          setTimeout(() => setPasteSuccess(false), 2000);
          // Optional auto-fetch on clipboard paste
          onExtract(text.trim());
        } else if (text) {
          setUrl(text.trim());
        }
      }
    } catch {
      // In case permission denied
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onExtract();
    }
  };

  return (
    <section id="downloader" className="relative pt-12 pb-14 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
      {/* Background glow ambient */}
      <div className="absolute inset-0 -top-12 flex justify-center pointer-events-none overflow-hidden">
        <div className="w-[500px] h-[300px] bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-indigo-500/10 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 space-y-4">
        {/* Anti-slop clean typography kicker */}
        <p className="text-xs uppercase tracking-widest font-semibold text-rose-600 dark:text-rose-400">
          Fast · Watermark-Free · Studio Quality
        </p>

        {/* Primary Headline with balance */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white" style={{ textWrap: 'balance' }}>
          Download Any Social Media Video in Full HD & MP3
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Paste any link from YouTube, TikTok, Instagram, Twitter/X, Facebook, or Reddit.
          Extract direct 1080p video or 320kbps audio in milliseconds with zero watermarks.
        </p>

        {/* Input Form Box */}
        <form onSubmit={handleSubmit} className="mt-8 max-w-3xl mx-auto">
          <div className="relative group p-1.5 sm:p-2 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 shadow-xl shadow-neutral-500/5 dark:shadow-black/40 focus-within:border-rose-500 dark:focus-within:border-rose-500 transition-all duration-200">
            <div className="flex items-center gap-2">
              {/* Left icon with platform detection */}
              <div className="pl-3 sm:pl-4 flex items-center justify-center pointer-events-none shrink-0">
                {getDetectedIcon()}
              </div>

              {/* Main text input */}
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste video link here (e.g., https://www.tiktok.com/...)"
                disabled={isLoading}
                required
                className="w-full bg-transparent px-2 py-3 text-sm sm:text-base text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none"
              />

              {/* Clear button if text exists */}
              {url && !isLoading && (
                <button
                  type="button"
                  onClick={onClear}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title="Clear link"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Paste button */}
              {!url && (
                <button
                  type="button"
                  onClick={handlePaste}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors shrink-0"
                  title="Paste from clipboard"
                >
                  {pasteSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Pasted!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-3.5 h-3.5" />
                      <span>Paste</span>
                    </>
                  )}
                </button>
              )}

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                className="flex items-center justify-center gap-2 px-5 sm:px-7 py-3 text-sm sm:text-base font-bold text-white bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:from-rose-500 hover:via-pink-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-rose-500/25 transition-all shrink-0 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Fetching Video...</span>
                  </>
                ) : (
                  <>
                    <span>Download Video</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Browser Download Hint */}
          <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Direct file download — stream goes straight to your browser's download manager (top-right 📥)</span>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="mt-4 p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400 text-sm flex items-start gap-2.5 text-left">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <div>
                <p className="font-semibold">{errorMessage}</p>
                <p className="text-xs opacity-90 mt-0.5">
                  Make sure the link is copied directly from the browser or app and the video is public.
                </p>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
};
