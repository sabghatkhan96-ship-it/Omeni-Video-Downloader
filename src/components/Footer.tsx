import React from 'react';
import { Download } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand Lockup */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center text-white">
            <Download className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-white">
            Omni<span className="text-rose-500">Stream</span>
          </span>
        </div>

        {/* Quiet Navigation */}
        <nav className="flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
          <a href="#downloader" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            Downloader
          </a>
          <a href="#platforms" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            Supported Sites
          </a>
          <a href="#how-it-works" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            How It Works
          </a>
          <a href="#faq" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            FAQ
          </a>
        </nav>

        {/* Copyright */}
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          &copy; {new Date().getFullYear()} OmniStream. For personal, educational & fair use only.
        </p>
      </div>

      <div className="max-w-6xl mx-auto mt-6 pt-6 border-t border-neutral-200/50 dark:border-neutral-800/50 text-center">
        <p className="text-[11px] text-neutral-400 dark:text-neutral-600 leading-relaxed max-w-3xl mx-auto">
          OmniStream is not affiliated with or endorsed by YouTube, Meta, TikTok, X Corp, or Reddit. All trademarks, logos, and copyrights belong to their respective owners. Users are solely responsible for ensuring compliance with content owners&apos; intellectual property rights.
        </p>
      </div>
    </footer>
  );
};
