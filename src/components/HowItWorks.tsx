import React from 'react';
import { Copy, Sliders, Download, CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Copy the Video Link',
    description: 'Open YouTube, TikTok, Instagram, Twitter/X, or Facebook. Click the Share button and select "Copy Link".',
    icon: <Copy className="w-5 h-5 text-rose-500" />
  },
  {
    step: '02',
    title: 'Paste and Select Quality',
    description: 'Paste the link into the search box above. Preview the video and pick your desired resolution: 1080p Full HD, 720p, or studio MP3 audio.',
    icon: <Sliders className="w-5 h-5 text-indigo-500" />
  },
  {
    step: '03',
    title: 'Instant Watermark-Free Download',
    description: 'Click Download. The video streams directly into your device storage in seconds, completely free and without logos or watermarks.',
    icon: <Download className="w-5 h-5 text-emerald-500" />
  }
];

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-neutral-200/60 dark:border-neutral-800/60">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <p className="text-xs uppercase tracking-widest font-semibold text-rose-600 dark:text-rose-400">
          Simple 3-Step Process
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white mt-1">
          How to Download Social Media Videos
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
          No software installation, no browser extensions, and no registration required.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STEPS.map((item) => (
          <div
            key={item.step}
            className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm relative group hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                {item.icon}
              </div>
              <span className="font-mono text-2xl font-black text-neutral-300 dark:text-neutral-700">
                {item.step}
              </span>
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">
              {item.title}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
