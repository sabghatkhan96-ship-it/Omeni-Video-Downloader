import { extractFacebookVideo } from '../src/utils/facebookExtractor';

// Vercel Serverless Function Types
interface VercelRequest {
  body?: any;
  query?: any;
  method?: string;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => VercelResponse;
  setHeader: (name: string, value: string) => void;
  end: () => void;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const url = (req.body?.url || req.query.url) as string;
  if (!url) {
    return res.status(400).json({ success: false, message: 'Please provide a video URL!' });
  }

  const cleanUrl = url.trim();

  // TikTok Direct High Speed Stream
  if (cleanUrl.includes('tiktok.com')) {
    try {
      const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`);
      const tikData = await tikRes.json();
      if (tikData.code === 0 && tikData.data) {
        return res.json({
          success: true,
          title: tikData.data.title || 'TikTok Video',
          thumbnail: tikData.data.cover || '',
          downloadUrl: tikData.data.play || tikData.data.wmplay,
          directCdnUrl: tikData.data.play || tikData.data.wmplay,
          musicUrl: tikData.data.music,
          author: tikData.data.author?.nickname || 'TikTok Creator'
        });
      }
    } catch {}
  }

  // Facebook Direct High Speed Stream
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
          author: fbData.author || 'Facebook Creator'
        });
      }
    } catch {}
  }

  return res.json({
    success: true,
    title: 'Social Media Video',
    thumbnail: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=640&q=80',
    downloadUrl: cleanUrl,
    directCdnUrl: cleanUrl
  });
}
