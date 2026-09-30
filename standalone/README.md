# Universal Social Media Video Downloader Backend

A production-ready Node.js (Express) backend service for downloading and extracting media from **YouTube**, **Facebook**, **TikTok**, and **Instagram**.

---

## 🚀 Quick Start

### 1. Install Node Dependencies
```bash
npm install
```

### 2. Install FFmpeg (Required for 1080p Video + Audio Merging)
On Ubuntu / Debian VPS:
```bash
sudo apt update
sudo apt install -y ffmpeg
```
On CentOS / RHEL / Fedora:
```bash
sudo dnf install -y ffmpeg
```
On macOS:
```bash
brew install ffmpeg
```

Verify installation:
```bash
ffmpeg -version
```

### 3. Install Latest yt-dlp Binary
```bash
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```
Verify installation:
```bash
yt-dlp --version
```

### 4. Start the Server
```bash
npm start
```
The server will run on `http://0.0.0.0:5000`.

---

## 🍪 How to Bypass YouTube & Facebook Bot Detection (cookies.txt)

Datacenter IPs (AWS, DigitalOcean, Hetzner, Oracle, Vercel) can be throttled or challenged by YouTube and Facebook. Supplying a `cookies.txt` completely eliminates these blocks.

1. Install the Chrome / Edge extension **"Get cookies.txt LOCALLY"** (open-source).
2. Log into YouTube and Facebook in your browser.
3. Open the extension and click **Export Cookies**.
4. Save the exported file as `cookies.txt` in the root folder alongside `server.js`.
5. Restart the server:
   ```bash
   node server.js
   ```
The backend automatically detects `cookies.txt` and forwards authenticated headers to yt-dlp via `--cookies cookies.txt`.

---

## 📡 API Reference

### POST `/api/download`
**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Successful Response:**
```json
{
  "success": true,
  "platform": "youtube",
  "id": "dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up (Official Video)",
  "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
  "duration": "3:33",
  "author": "Rick Astley",
  "downloadUrl": "https://rr5---sn-...",
  "formats": [
    {
      "formatId": "137",
      "quality": "1080p",
      "resolution": "1920x1080",
      "ext": "mp4",
      "filesizeApprox": "48.2 MB",
      "url": "https://...",
      "isAudioOnly": false
    },
    {
      "formatId": "140",
      "quality": "128k",
      "ext": "m4a",
      "filesizeApprox": "3.3 MB",
      "url": "https://...",
      "isAudioOnly": true
    }
  ]
}
```
