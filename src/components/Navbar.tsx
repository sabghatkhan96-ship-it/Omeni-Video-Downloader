import React, { useState, useEffect } from 'react';
import { Download, History, Moon, Sun, Layers } from 'lucide-react';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenHistory: () => void;
  onOpenBatch: () => void;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  setDarkMode,
  onOpenHistory,
  onOpenBatch,
  historyCount,
}) => {
  const [activeTab, setActiveTab] = useState<'downloader' | 'platforms' | 'batch' | 'how' | 'faq'>('downloader');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['downloader', 'platforms', 'how-it-works', 'faq'];
      const scrollPos = window.scrollY + 200;
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            if (id === 'downloader') setActiveTab('downloader');
            if (id === 'platforms') setActiveTab('platforms');
            if (id === 'how-it-works') setActiveTab('how');
            if (id === 'faq') setActiveTab('faq');
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="sticky top-3 inset-x-0 z-50 flex justify-center px-3 sm:px-6 pointer-events-none mb-4">
      {/* Floating Pill Container with dark background, rounded borders, and glassmorphism */}
      <div className="pointer-events-auto w-full max-w-5xl rounded-full bg-neutral-900/95 dark:bg-black/90 text-white backdrop-blur-xl border border-neutral-700/60 dark:border-neutral-800 shadow-[0_10px_35px_rgba(0,0,0,0.4)] px-3.5 sm:px-6 py-2.5 flex items-center justify-between transition-all duration-300 hover:border-neutral-600">
        
        {/* Brand / Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(244,63,94,0.45)] group-hover:scale-110 transition-transform">
            <Download className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-white">
            Omni<span className="text-rose-400">Stream</span>
          </span>
        </a>

        {/* Floating Nav Links with Glowing Bottom Line Indicator */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 text-xs sm:text-sm font-medium">
          {[
            { id: 'downloader', label: 'Downloader', href: '#downloader' },
            { id: 'platforms', label: 'Platforms', href: '#platforms' },
            { id: 'batch', label: 'Batch Mode', onClick: onOpenBatch, icon: Layers },
            { id: 'how', label: 'How It Works', href: '#how-it-works' },
            { id: 'faq', label: 'FAQ', href: '#faq' },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return item.href ? (
              <a
                key={item.id}
                href={item.href}
                onClick={() => setActiveTab(item.id as any)}
                className={`relative px-3.5 py-1.5 rounded-full transition-all duration-200 hover:text-white ${
                  isActive ? 'text-white font-semibold' : 'text-neutral-400 hover:bg-neutral-800/60'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 inset-x-2 h-0.5 bg-gradient-to-r from-rose-500 via-pink-400 to-indigo-500 rounded-full shadow-[0_0_8px_#f43f5e]" />
                )}
              </a>
            ) : (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick?.();
                  setActiveTab(item.id as any);
                }}
                className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all duration-200 hover:text-white ${
                  isActive ? 'text-white font-semibold' : 'text-neutral-400 hover:bg-neutral-800/60'
                }`}
              >
                {item.icon && <item.icon className="w-3.5 h-3.5 text-indigo-400" />}
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 inset-x-2 h-0.5 bg-gradient-to-r from-rose-500 via-pink-400 to-indigo-500 rounded-full shadow-[0_0_8px_#f43f5e]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: History, Batch Mobile, Dark Toggle */}
        <div className="flex items-center gap-2">
          {/* Mobile Batch Mode */}
          <button
            onClick={onOpenBatch}
            title="Batch Mode"
            className="md:hidden p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* History Pill */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700/60 transition-all duration-200"
          >
            <History className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white shadow-[0_0_6px_rgba(244,63,94,0.6)]">
                {historyCount}
              </span>
            )}
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            aria-label="Toggle Theme"
            className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-300" />}
          </button>
        </div>
      </div>
    </header>
  );
};
