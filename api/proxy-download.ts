// Vercel Serverless Function for Direct Proxy Video/Audio Downloads
interface VercelRequest {
  body?: any;
  query: { [key: string]: string | string[] | undefined };
  method?: string;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => VercelResponse;
  setHeader: (name: string, value: string) => void;
  redirect: (statusOrUrl: string | number, url?: string) => void;
  write: (chunk: any) => boolean;
  end: () => void;
  send: (body: any) => void;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const rawUrl = (req.query.url as string) || (req.body?.url as string);
  const rawFilename = (req.query.filename as string) || 'video';
  const format = (req.query.format as string) || 'mp4';

  if (!rawUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  const targetUrl = decodeURIComponent(rawUrl).trim();
  const cleanFilename = (decodeURIComponent(rawFilename) || 'video')
    .slice(0, 50)
    .replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  const finalFilename = cleanFilename.endsWith(`.${format}`)
    ? cleanFilename
    : `${cleanFilename}.${format}`;

  const backendUrl = process.env.BACKEND_API_URL || process.env.REMOTE_BACKEND_URL;
  if (backendUrl) {
    return res.redirect(302, `${backendUrl.replace(/\/$/, '')}/api/stream-media?url=${encodeURIComponent(targetUrl)}&filename=${encodeURIComponent(cleanFilename)}&format=${encodeURIComponent(format)}`);
  }

  // If this is a direct external CDN stream (e.g. Facebook fbcdn, TikTok TikWM, RapidCDN, AWS)
  if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
    // If the target URL already has download flags (e.g. rapidcdn with dl=1)
    if (targetUrl.includes('rapidcdn.app') && targetUrl.includes('dl=1')) {
      return res.redirect(302, targetUrl);
    }

    try {
      const referer =
        targetUrl.includes('fbcdn') ||
        targetUrl.includes('facebook') ||
        targetUrl.includes('rapidcdn')
          ? 'https://www.facebook.com/'
          : targetUrl.includes('tikwm')
          ? 'https://www.tikwm.com/'
          : targetUrl.includes('tiktok')
          ? 'https://www.tiktok.com/'
          : '';

      const upstreamHeaders: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      };
      if (referer) {
        upstreamHeaders['Referer'] = referer;
      }

      // 1. Fetch upstream stream headers
      const upstream = await fetch(targetUrl, {
        headers: upstreamHeaders
      });

      if (!upstream.ok) {
        // Fallback: Redirect directly to the CDN video link so browser downloads it
        return res.redirect(302, targetUrl);
      }

      const contentType =
        upstream.headers.get('content-type') ||
        (format === 'mp3' ? 'audio/mpeg' : 'video/mp4');

      // Set standard headers for Chrome/Edge/Firefox to trigger the top-right download tray
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${finalFilename}"; filename*=${encodeURIComponent(finalFilename)}`
      );
      res.setHeader('Content-Type', contentType);
      const contentLength = upstream.headers.get('content-length');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }

      // Stream binary chunks directly to response
      if (upstream.body) {
        // @ts-ignore
        const reader = upstream.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
        return;
      } else {
        const buffer = await upstream.arrayBuffer();
        res.send(Buffer.from(buffer));
        return;
      }
    } catch (err: any) {
      // If serverless fetch fails, redirect directly to the target URL so user gets the file
      return res.redirect(302, targetUrl);
    }
  }

  // If relative URL (sample / fallback)
  if (targetUrl.includes('video_') || targetUrl.includes('landscape') || targetUrl.includes('vertical')) {
    return res.redirect(302, '/media/sample_1080p.mp4');
  }
  return res.redirect(302, targetUrl || '/media/sample_1080p.mp4');
}
