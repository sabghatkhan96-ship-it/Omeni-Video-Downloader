export interface MediaFormat {
  id: string;
  type: 'video' | 'audio' | 'thumbnail';
  format: string; // 'mp4' | 'mp3' | 'm4a' | 'jpg'
  quality: string; // '1080p Full HD' | '720p HD' | '480p' | '320kbps'
  resolution?: string;
  fps?: number;
  hasAudio: boolean;
  hasVideo: boolean;
  filesizeApprox: string;
  filesizeBytes: number;
  url: string;
  note?: string;
}

export interface ExtractedMedia {
  id: string;
  originalUrl: string;
  platform: 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter' | 'reddit' | 'pinterest' | 'vimeo' | 'threads' | 'other';
  platformName: string;
  title: string;
  author: string;
  authorUrl?: string;
  thumbnail: string;
  durationSeconds: number;
  durationFormatted: string;
  views?: string;
  likes?: string;
  uploadDate?: string;
  formats: MediaFormat[];
  samplePlayableUrl: string;
  codecInfo?: {
    videoCodec: string;
    audioCodec: string;
    container: string;
    isCompatibleEverywhere: boolean;
  };
}

export interface HistoryItem {
  id: string;
  title: string;
  thumbnail: string;
  author: string;
  platform: string;
  originalUrl: string;
  downloadedAt: number;
  formatDownloaded: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
