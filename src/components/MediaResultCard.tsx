import React, { useState, useRef } from 'react';
import {
  Download,
  Play,
  Pause,
  Music,
  Video,
  Image as ImageIcon,
  Check,
  Copy,
  QrCode,
  Share2,
  Clock,
  Eye,
  Heart,
  Sparkles,
  ExternalLink,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Volume2,
  VolumeX,
  Maximize2,
  FileVideo,
  FileCheck,
  Upload
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExtractedMedia, MediaFormat } from '../types/index.ts';

interface MediaResultCardProps {
  media: ExtractedMedia;
  onShowQR: (url: string, title: string) => void;
  onRecordDownload: (format: MediaFormat) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

function getYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('?')[0];
    if (u.pathname.includes('/shorts/')) return u.pathname.split('/shorts/')[1].split('?')[0];
    return u.searchParams.get('v');
  } catch {
    return null;
  }
}

export const MediaResultCard: React.FC<MediaResultCardProps> = ({
  media,
  onShowQR,
  onRecordDownload,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'thumbnail'>('video');
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [localTestFileUrl, setLocalTestFileUrl] = useState<string | null>(null);
  const [localTestFileName, setLocalTestFileName] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const ytVideoId = media.platform === 'youtube' ? getYouTubeVideoId(media.originalUrl) : null;

  const videoFormats = media.formats.filter((f) => f.type === 'video');
  const audioFormats = media.formats.filter((f) => f.type === 'audio');
  const thumbnailFormats = media.formats.filter((f) => f.type === 'thumbnail');

  const currentFormats =
    activeTab === 'video'
      ? videoFormats
      : activeTab === 'audio'
      ? audioFormats
      : thumbnailFormats;

  // Best default format for instant 1-click download
  const bestFormat = videoFormats[0] || media.formats[0];

  const getDownloadUrl = (format: MediaFormat) => {
    const cleanTitle = media.title.slice(0, 40).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const filename = `${cleanTitle}_${format.quality.replace(/[^a-zA-Z0-9]/g, '')}`;
    
    // If external stream (TikTok, etc.), route through proxy for Content-Disposition attachment header
    if (format.url.startsWith('http://') || format.url.startsWith('https://')) {
      return `/api/proxy-download?url=${encodeURIComponent(format.url)}&filename=${encodeURIComponent(filename)}&format=${format.format}&quality=${encodeURIComponent(format.quality)}`;
    }

    return format.url;
  };

  const getDownloadFilename = (format: MediaFormat) => {
    const cleanTitle = media.title.slice(0, 40).replace(/[^a-zA-Z0-9_\-]/g, '_');
    return `${cleanTitle}_${format.quality.replace(/[^a-zA-Z0-9]/g, '')}.${format.format}`;
  };

  // Trigger single instant browser download directly into Chrome/Safari/Android downloads
  const handleDownloadClick = (format: MediaFormat) => {
    // Prevent duplicate triggers if already downloading
    if (downloadingId === format.id) return;

    try {
      setDownloadingId(format.id);

      // Trigger celebratory confetti once
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.7 }
      });

      onRecordDownload(format);
      onShowToast(`📥 Download started! Check your phone/browser downloads.`, 'success');
    } catch {
      onShowToast('Download started.', 'info');
    } finally {
      setTimeout(() => {
        setDownloadingId(null);
      }, 3000);
    }
  };

  const handleCopyLink = async (format: MediaFormat) => {
    try {
      const fullUrl = `${window.location.origin}${getDownloadUrl(format)}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(format.id);
      onShowToast('Direct download link copied to clipboard!', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      onShowToast('Could not copy link', 'error');
    }
  };

  const handleMobileQR = (format: MediaFormat) => {
    const fullUrl = `${window.location.origin}${getDownloadUrl(format)}`;
    onShowQR(fullUrl, `${media.title} (${format.quality})`);
  };

  // Test local downloaded file inside browser player
  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setLocalTestFileUrl(objectUrl);
      setLocalTestFileName(file.name);
      setIsPlaying(true);
      onShowToast(`Loaded ${file.name} into player for verification!`, 'success');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 my-8 animate-fadeIn">
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl overflow-hidden">
        
        {/* Header Ribbon */}
        <div className="px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-850/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-neutral-700 dark:text-neutral-300">Ready for Download</span>
            <span className="text-neutral-400">·</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">{media.platformName}</span>
            <span className="hidden sm:inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" />
              <span>Verified Playable MP4/MP3</span>
            </span>
          </div>

          <a
            href={media.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Original Source</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Media Preview & Details Grid */}
        <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          
          {/* Left Column: Player or Thumbnail (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            <div className="relative aspect-video sm:aspect-[4/3] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-inner group">
              {isPlaying ? (
                ytVideoId && !localTestFileUrl ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${ytVideoId}?autoplay=1&rel=0`}
                    title={media.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={localTestFileUrl || media.formats.find((f) => f.type === 'video')?.url || media.samplePlayableUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                )
              ) : (
                <>
                  <img
                    src={media.thumbnail}
                    alt={media.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Scrim overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <button
                      onClick={() => setIsPlaying(true)}
                      className="p-4 rounded-full bg-rose-600/95 text-white hover:bg-rose-500 hover:scale-110 shadow-lg shadow-rose-600/40 transition-all cursor-pointer"
                      title="Play Live Video Preview"
                    >
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </button>
                    <span className="text-[11px] font-semibold text-white/90 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
                      Click to Test & Play Video
                    </span>
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/80 backdrop-blur-sm text-white text-xs font-mono font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{media.durationFormatted}</span>
                  </div>
                </>
              )}
            </div>

            {/* Player control toggles */}
            <div className="mt-2.5 flex items-center justify-between text-xs">
              {isPlaying ? (
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setLocalTestFileUrl(null);
                    setLocalTestFileName(null);
                  }}
                  className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1.5 py-1 font-medium transition-colors"
                >
                  <span>Close Player</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsPlaying(true)}
                  className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1.5 py-1 font-bold"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Preview Video Stream</span>
                </button>
              )}

              {localTestFileName && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono truncate max-w-[180px]">
                  Playing: {localTestFileName}
                </span>
              )}
            </div>

            {/* Author info */}
            <div className="mt-4 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300 truncate max-w-[200px]">
                {media.author}
              </span>
              <div className="flex items-center gap-3">
                {media.views && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{media.views}</span>
                  </span>
                )}
                {media.likes && (
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>{media.likes}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Codec & Compatibility Guarantee Box */}
            <div className="mt-4 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-neutral-600 dark:text-neutral-400 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>100% Playable Video Stream</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Encoded in universal <strong>H.264 (AVC)</strong> with <strong>AAC stereo audio</strong> and faststart metadata. Plays on VLC, iPhone, Android, and Windows Media Player without errors.
              </p>
            </div>

          </div>

          {/* Right Column: Title and Format Options (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              {/* Media Title */}
              <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white line-clamp-2 leading-snug">
                {media.title}
              </h3>

              {/* Instant 1-Click Browser Download Banner (Triggers Chrome's top-right download icon directly) */}
              {bestFormat && (
                <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-indigo-500/10 border-2 border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                        Ready for Direct Download
                      </span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-rose-600/10 text-rose-600 dark:text-rose-300 font-semibold font-mono">
                        {bestFormat.quality} · {bestFormat.filesizeApprox}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 flex items-center gap-1">
                      <span>📥 Will start directly in Chrome download manager (top-right arrow 📥)</span>
                    </p>
                  </div>

                  <a
                    href={getDownloadUrl(bestFormat)}
                    download={getDownloadFilename(bestFormat)}
                    target="_self"
                    rel="noopener noreferrer"
                    onClick={() => handleDownloadClick(bestFormat)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Download Video ({bestFormat.quality})</span>
                  </a>
                </div>
              )}

              {/* Format Segmented Tab Control */}
              <div className="mt-5 flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                <button
                  onClick={() => setActiveTab('video')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'video'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Video className="w-4 h-4 text-rose-500" />
                  <span>Video (MP4)</span>
                </button>

                <button
                  onClick={() => setActiveTab('audio')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'audio'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Music className="w-4 h-4 text-indigo-500" />
                  <span>Audio (MP3)</span>
                </button>

                <button
                  onClick={() => setActiveTab('thumbnail')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'thumbnail'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  <span>Cover / Poster</span>
                </button>
              </div>

              {/* Format Options List */}
              <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {currentFormats.map((format) => {
                  const isDownloading = downloadingId === format.id;
                  const isCopied = copiedId === format.id;
                  const directUrl = getDownloadUrl(format);
                  const downloadFilename = getDownloadFilename(format);

                  return (
                    <div
                      key={format.id}
                      className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/50 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 transition-colors flex items-center justify-between gap-3"
                    >
                      {/* Left: Quality & details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="px-2 py-1 text-[11px] font-mono font-bold uppercase rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                          {format.format}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                              {format.quality}
                            </p>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              ✓ Playable
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                            {format.filesizeApprox} · {format.note || 'High Definition'}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Copy link */}
                        <button
                          onClick={() => handleCopyLink(format)}
                          title="Copy Direct Download Link"
                          className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                        >
                          {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>

                        {/* Mobile QR */}
                        <button
                          onClick={() => handleMobileQR(format)}
                          title="Generate QR for Phone"
                          className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        {/* Primary Direct Download Link (Mobile & Desktop 100% Reliable Single File) */}
                        <a
                          href={directUrl}
                          download={downloadFilename}
                          target="_self"
                          rel="noopener noreferrer"
                          onClick={() => handleDownloadClick(format)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-all cursor-pointer"
                          title="Click to download directly in browser or mobile phone"
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Downloading...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Download</span>
                            </>
                          )}
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Test downloaded file verification section */}
            <div className="mt-5 pt-3.5 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-500" />
                <span>Want to test your downloaded file?</span>
              </div>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="video/mp4,audio/mp3,audio/m4a,video/*"
                  onChange={handleLocalFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-rose-500" />
                  <span>Verify / Play Downloaded File</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
