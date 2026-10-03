# SnapLens

A Snapchat-style camera that runs in the browser: live filters, photos and videos.

## Features
- 30 lenses in a Snapchat-style explorer (tap ✨): Recents, Favourites, For you, Aesthetic, Games, search
- Vertical 9:16 output, the shape Snapchat uses
- 17 live filters (colour looks, pixel, falling hearts/sparkles/snow, face-tracked: shades, love eyes, dog, crown, clown)
- Tap the round button for a photo, hold it to record a video (up to 60 s, with sound)
- Flip between front and back camera
- Preview, then Save (download), Share (where supported) or Discard
- Spacebar takes a photo; arrow keys or swipe change the filter

## Run
Cameras need `localhost` or https:

    python3 -m http.server 8001

then open http://localhost:8001 and allow camera access.

## Lenses
- **Aesthetic:** Mirror, Day Stamp, Film Grain, VHS, Golden Hour, Soft Glow, plus the colour looks
- **Face:** Big Mouth, Bug Eyes, Panda, Bunny, Old Man, Shades, Love Eyes, Dog, Crown, Clown
- **Games:** Mouth Munch (open your mouth to eat the food), Pop It (touch balloons with your nose)
- Star a lens to keep it in Favourites; Recents and use counts are stored on your device only.

## Face tracking
Face filters use MediaPipe Face Landmarker (478 landmarks), downloaded from a CDN the first
time you pick a face filter (a few MB, so you need internet once per load). Stickers follow your
eyes, nose and forehead, tilt with your head, and the Dog's tongue appears when you open your mouth.
If it cannot load, stickers fall back to a fixed spot.

## Notes
- Best in Chrome/Edge. Colour filters need `ctx.filter` (not in Safari yet).
- Saved videos are .webm (Chrome/Firefox) or .mp4 (Safari).
