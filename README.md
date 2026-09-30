# 📥 OmniStream Video Downloader

A high-performance, full-stack social media video and audio downloader supporting **TikTok (Watermark-Free)**, **Facebook HD**, **YouTube (1080p/720p/MP3)**, **Instagram Reels**, **Twitter/X**, **Reddit**, **Pinterest**, and **Vimeo**.

---

## 🚀 Key Features

- **Direct Browser Downloads**: Triggers native browser download manager directly (Chrome `📥` top-right tray) with real file streaming.
- **TikTok No-Watermark Engine**: Instant direct extraction of clean HD video and original audio tracks without watermarks via TikWM CDN.
- **Universal Social Support**: Native extraction for YouTube, Facebook (HD/SD), Instagram Reels, Twitter/X, and Reddit videos with merged audio.
- **Multiple Quality Formats**: 1080p Full HD, 720p HD, 480p SD, 320kbps Studio MP3, AAC M4A, and high-res poster artworks.
- **Dual Architecture**:
  - Full-stack React + Tailwind CSS + Node/Express backend (`/src` & `server.ts`).
  - Standalone lightweight Express + HTML/Tailwind CDN setup (`/standalone/server.js` & `/standalone/index.html`).
- **In-Browser Video Tester & Player**: Built-in player to test and verify downloaded video files with codec inspection (H.264 / AAC).
- **Mobile QR Generator**: Generate instant QR codes to scan and download videos directly onto your smartphone.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Backend**: Node.js, Express, `yt-dlp` streaming engine, TikWM API
- **Build Tool**: Vite
- **Media Formats**: MP4 (H.264 / AVC), MP3 (320kbps Stereo), M4A (AAC)

---

## 📦 Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/sabghatkhan96-ship-it/Omeni-Video-Downloader.git
cd Omeni-Video-Downloader
```

### 2. Install dependencies
```bash
npm install
```

### 3. Ensure `yt-dlp` is available
If not already installed on your system:
```bash
# macOS
brew install yt-dlp

# Linux (Debian/Ubuntu)
sudo apt update && sudo apt install yt-dlp

# Or standalone binary in bin/
chmod +x ./bin/yt-dlp
```

### 4. Run the development server
```bash
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## ⚡ Running the Lightweight Standalone Version

If you only want a quick 2-file lightweight server without React:
```bash
cd standalone
npm init -y
npm install express cors body-parser
node server.js
```
Open `standalone/index.html` in your browser.

---

## 🔌 API Endpoints

- `POST /api/extract` — Extract metadata and quality formats for a video URL.
- `POST /api/download` — Direct video information and instant download URL.
- `GET /api/proxy-download` — Stream video/audio file with `Content-Disposition: attachment` headers directly to browser.
- `GET /api/health` — Service health check.

---

## 📄 License
MIT License
