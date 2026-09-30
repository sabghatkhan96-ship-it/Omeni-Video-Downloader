import React from 'react';
import {
  ShieldCheck,
  Zap,
  Sparkles,
  Music,
  Smartphone,
  Layers,
  Infinity as InfinityIcon,
  Video
} from 'lucide-react';

const FEATURES = [
  {
    title: 'Zero Watermarks & Clean Video',
    description: 'Specialized parsing logic automatically extracts clean, unwatermarked high-definition MP4 streams from TikTok, Instagram Reels, and YouTube Shorts.',
    icon: <Sparkles className="w-5 h-5 text-rose-500" />,
    colSpan: 'md:col-span-2'
  },
  {
    title: 'Studio-Grade 320kbps MP3 Ripper',
    description: 'Extract lossless sound, trending TikTok songs, and background music in high-bitrate MP3 or AAC formats ready for any audio player.',
    icon: <Music className="w-5 h-5 text-indigo-500" />,
    colSpan: 'md:col-span-1'
  },
  {
    title: 'Direct-to-Phone QR Beam',
    description: 'Generate on-the-fly QR codes to save videos directly onto iPhone Camera Roll or Android storage without cables or desktop transfers.',
    icon: <Smartphone className="w-5 h-5 text-emerald-500" />,
    colSpan: 'md:col-span-1'
  },
  {
    title: 'Lightning-Fast Streaming Proxy',
    description: 'High-bandwidth streaming proxy bypasses rate limits and platform download restrictions with automatic resume and full browser download management.',
    icon: <Zap className="w-5 h-5 text-amber-500" />,
    colSpan: 'md:col-span-2'
  },
  {
    title: 'Batch URL Extraction Queue',
    description: 'Paste up to 10 video links at once to batch process clips, playlists, and reels with one-click multi-download capabilities.',
    icon: <Layers className="w-5 h-5 text-purple-500" />,
    colSpan: 'md:col-span-1'
  },
  {
    title: '100% Free & Private',
    description: 'No accounts, no user data storage, no trackers. Video streams are proxied ephemerally in accordance with standard fair use guidelines.',
    icon: <ShieldCheck className="w-5 h-5 text-sky-500" />,
    colSpan: 'md:col-span-2'
  }
];

export const FeaturesBento: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-neutral-200/60 dark:border-neutral-800/60">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <p className="text-xs uppercase tracking-widest font-semibold text-rose-600 dark:text-rose-400">
          Advanced Capabilities
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white mt-1">
          Built for Speed, Fidelity & Precision
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
          Everything you need from a modern video utility in one seamless, ad-free web app.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {FEATURES.map((feat, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col justify-between ${feat.colSpan} hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors`}
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                {feat.icon}
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">
                {feat.title}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {feat.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
