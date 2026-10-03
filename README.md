# SnapLens

A Snapchat-style camera that runs in the browser: live filters, photos and videos.

## Features
- 16 live filters (colour looks, pixel, falling hearts/sparkles/snow, face stickers: shades, dog, crown, clown)
- Tap the round button for a photo, hold it to record a video (up to 60 s, with sound)
- Flip between front and back camera
- Preview, then Save (download) or Discard

## Run
Cameras need `localhost` or https:

    python3 -m http.server 8001

then open http://localhost:8001 and allow camera access.

## Notes
- Best in Chrome/Edge. Colour filters need `ctx.filter` (not in Safari yet).
- Stickers follow your face where the browser has the Face Detection API (Chrome with
  "Experimental Web Platform features" enabled); otherwise they sit in a default position.
  Real face tracking (MediaPipe) is the next step.
- Saved videos are .webm (Chrome/Firefox) or .mp4 (Safari).
