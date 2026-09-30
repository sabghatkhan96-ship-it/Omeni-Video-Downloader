#!/bin/bash
set -e
mkdir -p ./public/media

echo "Generating Media Pack..."

# 1. 1080p Landscape (1920x1080)
ffmpeg -y \
  -f lavfi -i "testsrc=duration=12:size=1920x1080:rate=30" \
  -f lavfi -i "sine=frequency=440:duration=12" \
  -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.1 \
  -c:a aac -b:a 192k -ar 44100 -ac 2 \
  -movflags +faststart \
  ./public/media/video_1080p_landscape.mp4

# 2. 720p Landscape (1280x720)
ffmpeg -y \
  -f lavfi -i "testsrc=duration=12:size=1280x720:rate=30" \
  -f lavfi -i "sine=frequency=523.25:duration=12" \
  -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.0 \
  -c:a aac -b:a 192k -ar 44100 -ac 2 \
  -movflags +faststart \
  ./public/media/video_720p_landscape.mp4

# 3. 480p Landscape (854x480)
ffmpeg -y \
  -f lavfi -i "testsrc=duration=12:size=854x480:rate=30" \
  -f lavfi -i "sine=frequency=329.63:duration=12" \
  -c:v libx264 -pix_fmt yuv420p -profile:v baseline -level 3.1 \
  -c:a aac -b:a 128k -ar 44100 -ac 2 \
  -movflags +faststart \
  ./public/media/video_480p_landscape.mp4

# 4. 1080p Vertical Reel/Shorts/TikTok (1080x1920)
ffmpeg -y \
  -f lavfi -i "testsrc=duration=12:size=1080x1920:rate=30" \
  -f lavfi -i "sine=frequency=392.00:duration=12" \
  -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.1 \
  -c:a aac -b:a 192k -ar 44100 -ac 2 \
  -movflags +faststart \
  ./public/media/video_1080p_vertical.mp4

# 5. 720p Vertical Reel (720x1280)
ffmpeg -y \
  -f lavfi -i "testsrc=duration=12:size=720x1280:rate=30" \
  -f lavfi -i "sine=frequency=587.33:duration=12" \
  -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.0 \
  -c:a aac -b:a 192k -ar 44100 -ac 2 \
  -movflags +faststart \
  ./public/media/video_720p_vertical.mp4

# 6. MP3 320kbps Audio (Stereo, 44.1kHz, MP3)
ffmpeg -y \
  -f lavfi -i "sine=frequency=440:duration=15" \
  -c:a libmp3lame -b:a 320k -ar 44100 -ac 2 \
  ./public/media/audio_320k.mp3

# 7. MP3 192kbps Audio
ffmpeg -y \
  -f lavfi -i "sine=frequency=523.25:duration=15" \
  -c:a libmp3lame -b:a 192k -ar 44100 -ac 2 \
  ./public/media/audio_192k.mp3

# 8. M4A Apple Lossless / AAC Audio
ffmpeg -y \
  -f lavfi -i "sine=frequency=659.25:duration=15" \
  -c:a aac -b:a 256k -ar 44100 -ac 2 \
  ./public/media/audio_aac.m4a

# 9. HD Poster Graphic (1920x1080 JPEG)
ffmpeg -y \
  -f lavfi -i "testsrc=duration=1:size=1920x1080:rate=1" \
  -vframes 1 -q:v 2 \
  ./public/media/cover_poster.jpg

echo "Media generation finished successfully."
ls -lh ./public/media/
