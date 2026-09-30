/**
 * =========================================================================
 * UNIVERSAL SOCIAL MEDIA VIDEO DOWNLOADER BACKEND (PRODUCTION-GRADE)
 * Supports: YouTube, Facebook, TikTok, Instagram, Twitter/X, Reddit
 * Architecture: Node.js + Express + yt-dlp child_process spawn + FFmpeg
 * =========================================================================
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend applications
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Cache directory for downloaded media streams
const CACHE_DIR = path.resolve('/tmp/video_cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Optional browser cookies file to bypass bot detection on datacenter IPs
const COOKIES_PATH = path.resolve(__dirname, 'cookies.txt');
const HAS_COOKIES = fs.existsSync(COOKIES_PATH);

/**
 * 1. URL SANITIZATION & PLATFORM DETECTION
 * Strips tracking parameters from Facebook/Instagram/TikTok links
 */
function sanitizeUrl(rawUrl) {
  let url = (rawUrl || '').trim();
  
  // Facebook parameter stripping (removes mibextid, ref, etc.)
  if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.com')) {
    try {
      const u = new URL(url);
      const keepParams = ['v', 'id'];
      for (const key of Array.from(u.searchParams.keys())) {
        if (!keepParams.includes(key)) {
          u.searchParams.delete(key);
        }
      }
      url = u.toString().replace('m.facebook.com', 'www.facebook.com');
    } catch {}
  }
  
  // YouTube parameter normalization
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    try {
      const u = new URL(url);
      // Remove playlist/index params if user wants single video
      if (u.searchParams.has('v')) {
        const v = u.searchParams.get('v');
        url = `https://www.youtube.com/watch?v=${v}`;
      }
    } catch {}
  }

  return url;
}

function detectPlatform(url) {
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/facebook\.com|fb\.watch|fb\.com/i.test(url)) return 'facebook';
  if (/tiktok\.com/i.test(url)) return 'tiktok';
  if (/instagram\.com/i.test(url)) return 'instagram';
  if (/twitter\.com|x\.com/i.test(url)) return 'twitter';
  if (/reddit\.com/i.test(url)) return 'reddit';
  return 'universal';
}

/**
 * 2. ADVANCED YT-DLP EXECUTION VIA SPAWN
 * Avoids maxBuffer overflow by streaming stdout chunks.
 * Dynamically configures flags for YouTube & Facebook anti-bot bypass.
 */
function extractWithYtDlp(url, platform) {
  return new Promise((resolve, reject) => {
    const args = [
      '--dump-json',
      '--no-playlist',
      '--no-warnings',
      '--geo-bypass',
      // Anti-bot modern desktop User-Agent header
      '--user-agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    ];

    // YouTube specific optimization:
    // Fallback across Android, Web, and TV player APIs to bypass SABR/PO Token blocks
    if (platform === 'youtube') {
      args.push('--extractor-args', 'youtube:player_client=android,web,tv_embedded');
    }

    // Facebook specific optimization:
    // Custom language & navigation headers simulate normal web browser requests
    if (platform === 'facebook') {
      args.push('--add-header', 'Accept-Language:en-US,en;q=0.9');
      args.push('--add-header', 'Sec-Fetch-Mode:navigate');
    }

    // Instagram specific optimization:
    if (platform === 'instagram') {
      args.push('--add-header', 'Accept-Language:en-US,en;q=0.9');
    }

    // Pass cookies file if present on server (essential for age-restricted or flagged datacenter IPs)
    if (HAS_COOKIES) {
      args.push('--cookies', COOKIES_PATH);
    }

    args.push(url);

    // Prefer local binary if exists, else global system yt-dlp
    const localBinary = path.resolve(__dirname, '../bin/yt-dlp');
    const binPath = fs.existsSync(localBinary) ? localBinary : 'yt-dlp';

    const child = spawn(binPath, args);

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (chunk) => {
      stdoutData += chunk;
    });

    child.stderr.on('data', (chunk) => {
      stderrData += chunk;
    });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(stderrData || `yt-dlp exited with status code ${code}`));
      }

      try {
        const metadata = JSON.parse(stdoutData);
        resolve(metadata);
      } catch (err) {
        reject(new Error('Failed to parse video metadata JSON from extractor.'));
      }
    });

    // 25 second timeout safeguard
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Extraction request timed out after 25 seconds.'));
    }, 25000);

    child.on('exit', () => clearTimeout(timeout));
  });
}

/**
 * 3. COMPREHENSIVE API ENDPOINT: POST /api/download
 * Extracts metadata, multiple format options (1080p, 720p, 480p, MP3),
 * and direct CDN links.
 */
app.post('/api/download', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string' || !url.trim().startsWith('http')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid URL. Please provide a valid HTTP/HTTPS video URL.'
    });
  }

  const cleanUrl = sanitizeUrl(url);
  const platform = detectPlatform(cleanUrl);

  // TikTok high speed direct engine
  if (platform === 'tiktok') {
    try {
      const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`, {
        signal: AbortSignal.timeout(6000)
      });
      const tikData = await tikRes.json();
      if (tikData.code === 0 && tikData.data) {
        const d = tikData.data;
        const noWmUrl = d.play ? (d.play.startsWith('http') ? d.play : `https://www.tikwm.com${d.play}`) : '';
        const wmUrl = d.wmplay ? (d.wmplay.startsWith('http') ? d.wmplay : `https://www.tikwm.com${d.wmplay}`) : '';
        const musicUrl = d.music ? (d.music.startsWith('http') ? d.music : `https://www.tikwm.com${d.music}`) : '';

        return res.json({
          success: true,
          platform: 'tiktok',
          id: d.id,
          title: d.title || 'TikTok Video',
          thumbnail: d.cover || d.origin_cover || '',
          duration: `${d.duration || 15}s`,
          author: d.author?.nickname || 'TikTok Creator',
          downloadUrl: noWmUrl || wmUrl,
          formats: [
            { quality: 'HD No Watermark', format: 'mp4', url: noWmUrl },
            { quality: 'Original with Watermark', format: 'mp4', url: wmUrl },
            { quality: 'MP3 Audio', format: 'mp3', url: musicUrl }
          ]
        });
      }
    } catch (e) {
      console.warn('TikWM direct failed, falling back to yt-dlp:', e.message);
    }
  }

  // Universal yt-dlp extraction for YouTube, Facebook, Instagram, Twitter
  try {
    const rawMeta = await extractWithYtDlp(cleanUrl, platform);

    // Extract available video and audio streams
    const formats = [];
    if (Array.isArray(rawMeta.formats)) {
      for (const f of rawMeta.formats) {
        if (!f.url) continue;

        const isAudioOnly = f.vcodec === 'none' && f.acodec !== 'none';
        const isMuxed = f.vcodec !== 'none' && f.acodec !== 'none';

        if (isMuxed || isAudioOnly) {
          formats.push({
            formatId: f.format_id,
            quality: f.format_note || (f.height ? `${f.height}p` : 'Standard'),
            resolution: f.resolution || (f.height ? `${f.width}x${f.height}` : undefined),
            ext: f.ext,
            filesizeApprox: f.filesize ? `${(f.filesize / 1024 / 1024).toFixed(1)} MB` : undefined,
            url: f.url,
            isAudioOnly
          });
        }
      }
    }

    // Best progressive or merged stream URL
    const bestVideo = formats.find(f => !f.isAudioOnly) || formats[0];
    const directUrl = bestVideo ? bestVideo.url : (rawMeta.url || '');

    return res.json({
      success: true,
      platform,
      id: rawMeta.id,
      title: rawMeta.title || 'Extracted Video',
      thumbnail: rawMeta.thumbnail || '',
      duration: rawMeta.duration_string || `${rawMeta.duration || 0}s`,
      author: rawMeta.uploader || rawMeta.channel || 'Creator',
      downloadUrl: directUrl,
      formats: formats.length > 0 ? formats : [
        { quality: 'Original HD', format: 'mp4', url: directUrl }
      ]
    });
  } catch (err) {
    const errMsg = err.message || '';
    console.error(`[Extraction Error] [${platform}]`, errMsg);

    // User-friendly error message classifications
    if (errMsg.includes('Private video') || errMsg.includes('login') || errMsg.includes('requires authentication')) {
      return res.status(403).json({
        success: false,
        platform,
        message: 'This video is private or restricted. A cookies.txt file is required.'
      });
    }

    if (errMsg.includes('Video unavailable') || errMsg.includes('404') || errMsg.includes('not found')) {
      return res.status(404).json({
        success: false,
        platform,
        message: 'Video not found or was removed by the platform.'
      });
    }

    if (errMsg.includes('HTTP Error 429') || errMsg.includes('Too Many Requests') || errMsg.includes('bot')) {
      return res.status(429).json({
        success: false,
        platform,
        message: 'Platform rate limit hit. Place a fresh cookies.txt file on the server to bypass.'
      });
    }

    return res.status(500).json({
      success: false,
      platform,
      message: 'Failed to extract video streams from this URL.',
      details: errMsg.split('\n')[0]
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Universal Social Video Extractor',
    cookiesLoaded: HAS_COOKIES
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`Video Downloader Backend active on http://0.0.0.0:${PORT}`);
  console.log(`Cookies file: ${HAS_COOKIES ? 'ACTIVE (cookies.txt)' : 'NOT FOUND (Optional)'}`);
  console.log(`=======================================================`);
});
