import React, { useState } from 'react';
import {
  Youtube,
  Instagram,
  Twitter,
  Music2,
  Share2,
  Bookmark,
  Video,
  AtSign,
  Check,
  Sparkles,
  Info
} from 'lucide-react';

interface PlatformInfo {
  id: string;
  name: string;
  badge: string;
  icon: React.ReactNode;
  color: string;
  supportedFormats: string;
  sampleTip: string;
}

const PLATFORMS: PlatformInfo[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    badge: 'Shorts & 4K',
    icon: <Youtube className="w-5 h-5 text-red-500" />,
    color: 'hover:border-red-500/40',
    supportedFormats: '1080p, 720p, 480p, MP3',
    sampleTip: 'Copy video or shorts URL from browser bar or share menu.'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    badge: 'No Watermark',
    icon: <Music2 className="w-5 h-5 text-pink-500" />,
    color: 'hover:border-pink-500/40',
    supportedFormats: 'HD Clean, Original MP4, MP3',
    sampleTip: 'Tap Share on TikTok app and select "Copy Link".'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    badge: 'Reels & Stories',
    icon: <Instagram className="w-5 h-5 text-rose-500" />,
    color: 'hover:border-rose-500/40',
    supportedFormats: 'Full HD Reels, Post Videos, Audio',
    sampleTip: 'Works with public Reels, Carousels, and Post links.'
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    badge: 'HD Clip',
    icon: <Twitter className="w-5 h-5 text-sky-400" />,
    color: 'hover:border-sky-500/40',
    supportedFormats: '1080p, 720p, Audio Track',
    sampleTip: 'Copy the tweet URL from the share icon.'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    badge: 'Watch & Reels',
    icon: <Share2 className="w-5 h-5 text-blue-600" />,
    color: 'hover:border-blue-500/40',
    supportedFormats: '1080p HD, SD MP4, MP3',
    sampleTip: 'Copy link from public FB Watch or Feed posts.'
  },
  {
    id: 'reddit',
    name: 'Reddit',
    badge: 'Merged Audio',
    icon: <Bookmark className="w-5 h-5 text-orange-500" />,
    color: 'hover:border-orange-500/40',
    supportedFormats: 'HD MP4 with merged audio track',
    sampleTip: 'Copy post link from r/videos, r/funny, etc.'
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    badge: 'Video Pins',
    icon: <Bookmark className="w-5 h-5 text-red-600" />,
    color: 'hover:border-red-600/40',
    supportedFormats: 'Full HD MP4 Pin download',
    sampleTip: 'Paste the direct pin link (pin.it or pinterest.com).'
  },
  {
    id: 'threads',
    name: 'Threads',
    badge: 'HD Video',
    icon: <AtSign className="w-5 h-5 text-purple-500" />,
    color: 'hover:border-purple-500/40',
    supportedFormats: 'Original 1080p MP4',
    sampleTip: 'Copy link from the Meta Threads app or web.'
  }
];

interface PlatformStripProps {
  onSelectPlatformTip?: (tip: string) => void;
}

export const PlatformStrip: React.FC<PlatformStripProps> = () => {
  const [activePlatform, setActivePlatform] = useState<PlatformInfo | null>(null);

  return (
    <section id="platforms" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col items-center mb-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
          Supported Media Platforms
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Universal compatibility with automatic platform detection and optimized extraction engines
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {PLATFORMS.map((item) => {
          const isSelected = activePlatform?.id === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePlatform(isSelected ? null : item)}
              className={`p-3 rounded-xl border transition-all duration-200 text-left cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 ring-1 ring-rose-500'
                  : `border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 ${item.color} hover:bg-neutral-50 dark:hover:bg-neutral-850`
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  {item.icon}
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Active
                </span>
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white truncate">
                  {item.name}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                  {item.badge}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Platform Tip Box */}
      {activePlatform && (
        <div className="mt-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
              {activePlatform.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-900 dark:text-white">{activePlatform.name} Downloader</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">· {activePlatform.supportedFormats}</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                {activePlatform.sampleTip}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActivePlatform(null)}
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white self-end sm:self-center"
          >
            Dismiss
          </button>
        </div>
      )}
    </section>
  );
};
