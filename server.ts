import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { extractMediaInfo, detectPlatform } from './src/server/downloader.ts';
import { extractFacebookVideo } from './src/utils/facebookExtractor.ts';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MEDIA_DIR = path.resolve(__dirname, 'public/media');
const CACHE_DIR = path.resolve('/tmp/video_cache');
const COOKIES_PATH = path.resolve(__dirname, 'cookies.txt');
const YTDLP_BIN = path.resolve(__dirname, 'bin/yt-dlp');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Ensure yt-dlp binary is executable
if (fs.existsSync(YTDLP_BIN)) {
  try {
    fs.chmodSync(YTDLP_BIN, 0o755);
  } catch (err) {
    console.warn('Could not chmod yt-dlp binary:', err);
  }
}

// Clean tracking params from URLs (especially Facebook & Instagram)
function sanitizeUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.com')) {
    try {
      const u = new URL(url);
      const keep = ['v', 'id'];
      for (const key of Array.from(u.searchParams.keys())) {
        if (!keep.includes(key)) u.searchParams.delete(key);
      }
      url = u.toString().replace('m.facebook.com', 'www.facebook.com');
    } catch {}
  }
  return url;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Static Media Route for high-performance direct video/audio playback
  app.use(
    '/media',
    express.static(MEDIA_DIR, {
      setHeaders: (res, filePath) => {
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        if (filePath.endsWith('.mp4')) {
          res.setHeader('Content-Type', 'video/mp4');
        } else if (filePath.endsWith('.mp3')) {
          res.setHeader('Content-Type', 'audio/mpeg');
        } else if (filePath.endsWith('.m4a')) {
          res.setHeader('Content-Type', 'audio/mp4');
        } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
          res.setHeader('Content-Type', 'image/jpeg');
        }
      }
    })
  );

  // 2. API: Extract Media Information
  app.post('/api/extract', async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Please provide a valid video URL' });
      }

      const mediaInfo = await extractMediaInfo(url);
      return res.json({ success: true, data: mediaInfo });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to extract video';
      return res.status(422).json({
        error: message,
        details: 'Ensure the link is public, accessible, and from a supported video platform.'
      });
    }
  });

  // 2b. User API: /api/download (Direct Video Info & Download Link)
  app.post('/api/download', async (req: Request, res: Response) => {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide a video URL!' });
    }

    const cleanUrl = url.trim();

    // High speed TikTok extraction
    if (cleanUrl.includes('tiktok.com')) {
      try {
        const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`, {
          signal: AbortSignal.timeout(6000)
        });
        const tikData = await tikRes.json();
        if (tikData.code === 0 && tikData.data) {
          const d = tikData.data;
          return res.json({
            success: true,
            title: d.title || 'TikTok Video',
            thumbnail: d.cover || d.origin_cover || '',
            downloadUrl: `/api/stream-media?type=tiktok&sub=play&url=${encodeURIComponent(cleanUrl)}`,
            directCdnUrl: d.play || d.wmplay,
            musicUrl: d.music,
            author: d.author?.nickname || 'TikTok Creator',
            duration: d.duration || 15
          });
        }
      } catch {}
    }

    // Facebook Direct & SnapSave High Speed Stream
    if (
      cleanUrl.includes('facebook.com') ||
      cleanUrl.includes('fb.watch') ||
      cleanUrl.includes('fb.com')
    ) {
      try {
        const fbData = await extractFacebookVideo(cleanUrl);
        if (fbData.success && fbData.formats.length > 0) {
          const best = fbData.formats[0];
          return res.json({
            success: true,
            title: fbData.title || 'Facebook Video',
            thumbnail: fbData.thumbnail || '',
            downloadUrl: best.url,
            directCdnUrl: best.url,
            author: fbData.author || 'Facebook Creator',
            duration: fbData.durationSeconds || 45
          });
        }
      } catch {}
    }

    // yt-dlp handler for Facebook, YouTube, Twitter/X, Instagram, Reddit
    const ytArgs = [
      '--dump-json',
      '--no-playlist',
      '--no-warnings',
      '--geo-bypass',
      '--user-agent',
      '"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"'
    ];

    if (fs.existsSync(COOKIES_PATH)) {
      ytArgs.push(`--cookies "${COOKIES_PATH}"`);
    }

    if (cleanUrl.includes('facebook.com') || cleanUrl.includes('fb.watch')) {
      ytArgs.push('--add-header "Accept-Language:en-US,en;q=0.9"');
    }

    const command = `${YTDLP_BIN} ${ytArgs.join(' ')} "${cleanUrl}"`;
    exec(command, { maxBuffer: 1024 * 1024 * 25, timeout: 25000 }, (error, stdout) => {
      if (!error && stdout) {
        try {
          const videoInfo = JSON.parse(stdout);
          let directUrl = videoInfo.url || '';
          if (!directUrl && Array.isArray(videoInfo.formats)) {
            const valid = videoInfo.formats.filter((f: any) => f.url);
            if (valid.length > 0) directUrl = valid[valid.length - 1].url;
          }

          return res.json({
            success: true,
            title: videoInfo.title || 'Downloaded Video',
            thumbnail: videoInfo.thumbnail || '',
            downloadUrl: `/api/stream-media?type=ytdlp&format=best&url=${encodeURIComponent(cleanUrl)}`,
            directCdnUrl: directUrl,
            author: videoInfo.uploader || videoInfo.channel || 'Creator',
            duration: videoInfo.duration || 0
          });
        } catch {}
      }

      extractMediaInfo(cleanUrl)
        .then((info) => {
          const best = info.formats.find((f) => f.type === 'video') || info.formats[0];
          return res.json({
            success: true,
            title: info.title,
            thumbnail: info.thumbnail,
            downloadUrl: best.url,
            author: info.author,
            duration: info.durationSeconds
          });
        })
        .catch(() => {
          return res.status(500).json({
            success: false,
            message: 'Failed to fetch video. Make sure the link is public and valid.'
          });
        });
    });
  });

  // 3. API: Batch Extract
  app.post('/api/batch-extract', async (req: Request, res: Response) => {
    try {
      const { urls } = req.body;
      if (!Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ error: 'Please provide a list of URLs' });
      }

      const targetUrls = urls.slice(0, 10).filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
      
      const results = await Promise.allSettled(
        targetUrls.map((u) => extractMediaInfo(u))
      );

      const items = results.map((result, idx) => {
        if (result.status === 'fulfilled') {
          return { url: targetUrls[idx], success: true, data: result.value };
        } else {
          return { url: targetUrls[idx], success: false, error: 'Could not extract media from this URL' };
        }
      });

      return res.json({ success: true, results: items });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Batch processing failed';
      return res.status(500).json({ error: message });
    }
  });

  // Shared Helper: Stream local media
  const streamLocalFile = (res: Response, localFileName: string, finalFilename: string, contentType: string) => {
    const filePath = path.join(MEDIA_DIR, localFileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Media file not found');
    }

    const stat = fs.statSync(filePath);
    res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Accept-Ranges', 'bytes');
    fs.createReadStream(filePath).pipe(res);
  };

  // 4. API: Live Stream & Download Router (TikTok, Facebook, YouTube, Twitter, Reddit)
  const handleLiveDownload = async (req: Request, res: Response) => {
    let rawTargetUrl = String(req.query.url || '');
    let rawFilename = String(req.query.filename || 'video');
    let format = String(req.query.format || 'mp4').toLowerCase();
    let type = String(req.query.type || '');
    let sub = String(req.query.sub || '');

    // If url itself is a nested stream-media call: e.g. /api/stream-media?type=tiktok&sub=play&url=...
    if (rawTargetUrl.includes('/api/stream-media')) {
      try {
        const fakeUrl = new URL(rawTargetUrl, 'http://localhost');
        if (fakeUrl.searchParams.get('type')) type = String(fakeUrl.searchParams.get('type') || type);
        if (fakeUrl.searchParams.get('sub')) sub = String(fakeUrl.searchParams.get('sub') || sub);
        if (fakeUrl.searchParams.get('format')) format = String(fakeUrl.searchParams.get('format') || format).toLowerCase();
        if (fakeUrl.searchParams.get('url')) rawTargetUrl = String(fakeUrl.searchParams.get('url') || rawTargetUrl);
      } catch {}
    }

    const isAudio = format === 'mp3' || format === 'm4a' || sub === 'music' || format.includes('audio');
    const ext = isAudio ? 'mp3' : 'mp4';
    const contentType = isAudio ? 'audio/mpeg' : 'video/mp4';

    const cleanBaseName = rawFilename
      .replace(/[^a-zA-Z0-9_\- ]/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 50);

    const finalFilename = cleanBaseName.endsWith(`.${ext}`) ? cleanBaseName : `${cleanBaseName}.${ext}`;

    // A1. Direct TikWM Video/Audio CDN Link or Direct Media URL
    if (
      rawTargetUrl.includes('tikwm.com') ||
      rawTargetUrl.includes('/video/media/play/') ||
      rawTargetUrl.includes('fbcdn.net') ||
      rawTargetUrl.includes('cdninstagram.com')
    ) {
      try {
        console.log('[Direct Stream] Streaming CDN media directly:', rawTargetUrl);
        const referer = rawTargetUrl.includes('tikwm.com')
          ? 'https://www.tikwm.com/'
          : rawTargetUrl.includes('fbcdn')
          ? 'https://www.facebook.com/'
          : rawTargetUrl.includes('instagram')
          ? 'https://www.instagram.com/'
          : '';

        const upstreamHeaders: Record<string, string> = {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
        };
        if (referer) upstreamHeaders['Referer'] = referer;

        const cdnRes = await fetch(rawTargetUrl, {
          headers: upstreamHeaders,
          signal: AbortSignal.timeout(15000),
        });

        if (cdnRes.ok && cdnRes.body) {
          res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"; filename*=${encodeURIComponent(finalFilename)}`);
          res.setHeader('Content-Type', contentType);
          res.setHeader('Accept-Ranges', 'bytes');
          const cl = cdnRes.headers.get('content-length');
          if (cl) res.setHeader('Content-Length', cl);

          const reader = cdnRes.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(Buffer.from(value));
          }
          return res.end();
        } else {
          // If direct fetch returns non-200, 302 redirect so mobile browser downloads from source directly
          return res.redirect(302, rawTargetUrl);
        }
      } catch (directErr) {
        console.warn('[Direct Stream] Proxy fetch failed, redirecting browser directly:', directErr);
        return res.redirect(302, rawTargetUrl);
      }
    }

    // A2. TikTok Video URL (Extract live link via TikWM API)
    if (type === 'tiktok' || rawTargetUrl.includes('tiktok.com')) {
      try {
        console.log('[TikTok Downloader] Querying live stream for:', rawTargetUrl);
        const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(rawTargetUrl)}`, {
          signal: AbortSignal.timeout(8000)
        });
        const tikData = await tikRes.json();
        if (tikData.code === 0 && tikData.data) {
          let directCdnUrl = tikData.data.play; // default: No Watermark
          if (sub === 'wm') directCdnUrl = tikData.data.wmplay || directCdnUrl;
          if (sub === 'music' || isAudio) directCdnUrl = tikData.data.music || directCdnUrl;

          if (directCdnUrl) {
            if (!directCdnUrl.startsWith('http')) {
              directCdnUrl = `https://www.tikwm.com${directCdnUrl}`;
            }
            console.log('[TikTok Downloader] Streaming direct CDN bytes from TikTok...');
            const cdnRes = await fetch(directCdnUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Referer': 'https://www.tikwm.com/'
              }
            });

            if (cdnRes.ok && cdnRes.body) {
              res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"; filename*=${encodeURIComponent(finalFilename)}`);
              res.setHeader('Content-Type', contentType);
              res.setHeader('Accept-Ranges', 'bytes');
              const cl = cdnRes.headers.get('content-length');
              if (cl) res.setHeader('Content-Length', cl);

              const reader = cdnRes.body.getReader();
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(Buffer.from(value));
              }
              return res.end();
            } else {
              return res.redirect(302, directCdnUrl);
            }
          }
        }
      } catch (tikErr) {
        console.warn('[TikTok Downloader] Direct fetch error:', tikErr);
      }
    }

    // B. yt-dlp Live Download (YouTube, Facebook, Twitter, Reddit, Vimeo, Dailymotion)
    if (type === 'ytdlp' || rawTargetUrl.startsWith('http')) {
      try {
        console.log('[yt-dlp Downloader] Downloading live target:', rawTargetUrl);
        const targetCleanUrl = sanitizeUrl(rawTargetUrl);
        const formatSelector = isAudio
          ? 'audio'
          : format.includes('720')
          ? '720'
          : format.includes('480')
          ? '480'
          : 'best';

        const hash = Math.abs(hashCode(targetCleanUrl + formatSelector)).toString(36);
        const cacheFile = path.join(CACHE_DIR, `${hash}.${ext}`);

        // If not cached or cached file is too small, download now with yt-dlp
        if (!fs.existsSync(cacheFile) || fs.statSync(cacheFile).size < 100000) {
          const ytArgs = [
            '--geo-bypass',
            '--no-playlist',
            '--no-warnings',
            '--user-agent',
            '"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"'
          ];

          if (fs.existsSync(COOKIES_PATH)) {
            ytArgs.push(`--cookies "${COOKIES_PATH}"`);
          }

          if (targetCleanUrl.includes('facebook.com') || targetCleanUrl.includes('fb.watch')) {
            ytArgs.push('--add-header "Accept-Language:en-US,en;q=0.9"');
          }

          let cmd = `${YTDLP_BIN} ${ytArgs.join(' ')}`;
          if (isAudio) {
            cmd += ` -x --audio-format mp3 --audio-quality 0 -o "${cacheFile}" "${targetCleanUrl}"`;
          } else if (formatSelector === '720') {
            cmd += ` -f "bestvideo[height<=720]+bestaudio/best[height<=720]/best" --merge-output-format mp4 -o "${cacheFile}" "${targetCleanUrl}"`;
          } else if (formatSelector === '480') {
            cmd += ` -f "bestvideo[height<=480]+bestaudio/best[height<=480]/best" --merge-output-format mp4 -o "${cacheFile}" "${targetCleanUrl}"`;
          } else {
            cmd += ` -f "bestvideo[height<=1080]+bestaudio/best[height<=1080]/best" --merge-output-format mp4 -o "${cacheFile}" "${targetCleanUrl}"`;
          }

          console.log('[yt-dlp Downloader] Executing:', cmd);
          await execAsync(cmd, { timeout: 60000 });
        }

        if (fs.existsSync(cacheFile) && fs.statSync(cacheFile).size > 50000) {
          const stat = fs.statSync(cacheFile);
          console.log(`[yt-dlp Downloader] Successfully retrieved live media (${(stat.size / (1024 * 1024)).toFixed(1)} MB)!`);
          res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Length', stat.size);
          res.setHeader('Accept-Ranges', 'bytes');
          return fs.createReadStream(cacheFile).pipe(res);
        }
      } catch (ytdlpErr) {
        console.warn('[yt-dlp Downloader] Live download failed:', ytdlpErr);
      }
    }

    // C. Direct Remote HTTP stream fallback
    if (rawTargetUrl.startsWith('http')) {
      try {
        const upstreamRes = await fetch(rawTargetUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          signal: AbortSignal.timeout(10000)
        });
        if (upstreamRes.ok && upstreamRes.body) {
          res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
          res.setHeader('Content-Type', contentType);
          const cl = upstreamRes.headers.get('content-length');
          if (cl) res.setHeader('Content-Length', cl);

          const reader = upstreamRes.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(Buffer.from(value));
          }
          return res.end();
        }
      } catch {}
    }

    // D. If extraction and remote streaming failed, redirect to official video gateway instead of dead 502
    if (rawTargetUrl.includes('youtube.com') || rawTargetUrl.includes('youtu.be')) {
      let ytId = '';
      try {
        const u = new URL(rawTargetUrl);
        if (u.hostname.includes('youtu.be')) ytId = u.pathname.slice(1).split('?')[0];
        else if (u.pathname.includes('/shorts/')) ytId = u.pathname.split('/shorts/')[1]?.split('?')[0];
        else ytId = u.searchParams.get('v') || '';
      } catch {}
      if (!ytId) {
        const match = rawTargetUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:shorts\/|watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/);
        if (match) ytId = match[1];
      }

      if (ytId) {
        console.log(`[YouTube Gateway] Redirecting to official video gateway for ID: ${ytId}`);
        return res.redirect(302, `https://ssyoutube.com/watch?v=${ytId}`);
      }
    }

    if (rawTargetUrl.startsWith('http://') || rawTargetUrl.startsWith('https://')) {
      return res.redirect(302, rawTargetUrl);
    }

    return res.status(404).json({
      error: 'Download failed',
      message: 'Could not stream media from this URL.'
    });
  };

  app.get('/api/stream-media', handleLiveDownload);
  app.get('/api/proxy-download', handleLiveDownload);

  // 5. API: Supported platforms metadata
  app.get('/api/supported-platforms', (_req: Request, res: Response) => {
    res.json({
      platforms: [
        { id: 'youtube', name: 'YouTube', icon: 'youtube', qualities: ['1080p', '720p', '480p', 'MP3'], speed: 'Ultra Fast', watermarkFree: true },
        { id: 'tiktok', name: 'TikTok', icon: 'tiktok', qualities: ['HD No Watermark', 'Original', 'MP3'], speed: 'Instant Direct', watermarkFree: true },
        { id: 'facebook', name: 'Facebook', icon: 'facebook', qualities: ['1080p HD', 'SD', 'MP3'], speed: 'Ultra Fast', watermarkFree: true },
        { id: 'instagram', name: 'Instagram', icon: 'instagram', qualities: ['Reels HD', 'Stories', 'Audio'], speed: 'Fast', watermarkFree: true },
        { id: 'twitter', name: 'Twitter / X', icon: 'twitter', qualities: ['1080p', '720p', 'MP3'], speed: 'Instant', watermarkFree: true },
        { id: 'reddit', name: 'Reddit', icon: 'reddit', qualities: ['Merged Audio/Video', 'MP4'], speed: 'Fast', watermarkFree: true },
        { id: 'pinterest', name: 'Pinterest', icon: 'pinterest', qualities: ['Full HD MP4', 'Original'], speed: 'Instant', watermarkFree: true },
        { id: 'vimeo', name: 'Vimeo', icon: 'vimeo', qualities: ['1080p Cinema', '720p', 'MP3'], speed: 'High Speed', watermarkFree: true },
        { id: 'threads', name: 'Threads', icon: 'threads', qualities: ['1080p HD', 'MP3'], speed: 'Instant', watermarkFree: true }
      ]
    });
  });

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'OmniStream Video Downloader Engine',
      mediaPack: 'active',
      supportedCodecs: ['H.264 (AVC)', 'AAC', 'MP3 (MPEG Layer 3)']
    });
  });

  // Mount Vite middleware in development or static in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OmniStream Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
