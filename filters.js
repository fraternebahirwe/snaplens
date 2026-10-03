// Each filter: { id, name, css?, pixel?, faces?, draw?(ctx, w, h, t, faces) }
// css   -> applied with ctx.filter while drawing the camera frame
// pixel -> pixelate factor
// faces -> needs face positions (falls back to a centered guess)
// draw  -> overlay painted on top of the frame

function emojiRain(emojis, count) {
  const items = Array.from({ length: count }, (_, i) => ({
    x: Math.random(), speed: 0.08 + Math.random() * 0.18, phase: Math.random(), size: 24 + Math.random() * 30, e: emojis[i % emojis.length]
  }));
  return (ctx, w, h, t) => {
    items.forEach(it => {
      const y = ((t / 1000) * it.speed + it.phase) % 1;
      ctx.font = it.size + "px serif";
      ctx.globalAlpha = 0.9;
      ctx.fillText(it.e, it.x * w + Math.sin(t / 700 + it.phase * 9) * 20, y * (h + 60) - 30);
    });
    ctx.globalAlpha = 1;
  };
}

// Faces come from tracker.js (or a centred guess if tracking could not load):
// { eyes, eyeL, eyeR, forehead, headTop, nose, mouth, mouthBottom, chin, mouthOpen, angle, faceW, faceH }
function onFace(ctx, faces, fn) { faces.forEach(f => fn(f)); }

// Run fn with the origin at pt, rotated to follow the head tilt.
function at(ctx, pt, angle, fn) {
  ctx.save();
  ctx.translate(pt.x, pt.y);
  ctx.rotate(angle);
  fn();
  ctx.restore();
}

function emojiAt(ctx, e, x, y, size) {
  ctx.font = size + "px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(e, x, y);
}

function ellipse(ctx, x, y, rx, ry, rot, fill) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function vignette(ctx, w, h, strength) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0," + strength + ")");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

const FILTERS = [
  { id: "normal", name: "Normal" },
  { id: "warm", name: "☀️ Warm", css: "sepia(.35) saturate(1.4) hue-rotate(-10deg) brightness(1.05)" },
  { id: "cool", name: "🧊 Cool", css: "saturate(1.2) hue-rotate(15deg) brightness(1.05) contrast(1.05)" },
  { id: "bw", name: "⚫ B&W", css: "grayscale(1) contrast(1.2)" },
  { id: "vintage", name: "📷 Vintage", css: "sepia(.6) contrast(.9) brightness(1.05) saturate(.9)",
    draw: (ctx, w, h) => vignette(ctx, w, h, 0.55) },
  { id: "neon", name: "💜 Neon", css: "saturate(2.5) contrast(1.3) hue-rotate(260deg)" },
  { id: "dream", name: "☁️ Dreamy", css: "blur(1.5px) brightness(1.15) saturate(1.3)",
    draw: (ctx, w, h) => { ctx.fillStyle = "rgba(255,170,220,.18)"; ctx.fillRect(0, 0, w, h); } },
  { id: "invert", name: "🌀 Invert", css: "invert(1) hue-rotate(180deg)" },
  { id: "pixel", name: "👾 Pixel", pixel: 0.06 },
  { id: "hearts", name: "💕 Hearts", css: "saturate(1.2) brightness(1.05)", draw: emojiRain(["💖", "💕", "💗", "❤️"], 14) },
  { id: "sparkle", name: "✨ Sparkle", css: "brightness(1.08) contrast(1.05)", draw: emojiRain(["✨", "⭐", "💫"], 18) },
  { id: "snow", name: "❄️ Snow", css: "brightness(1.1) saturate(.9) hue-rotate(10deg)", draw: emojiRain(["❄️", "❅", "❆"], 22) },
  { id: "shades", name: "😎 Shades", faces: true,
    draw: (ctx, w, h, t, faces) => onFace(ctx, faces, f =>
      at(ctx, f.eyes, f.angle, () => emojiAt(ctx, "🕶️", 0, 0, f.faceW * 0.95))) },
  { id: "love", name: "😍 Love Eyes", faces: true,
    draw: (ctx, w, h, t, faces) => onFace(ctx, faces, f => {
      const pulse = 1 + Math.sin(t / 150) * 0.12;
      [f.eyeL, f.eyeR].forEach(e => at(ctx, e, f.angle, () => emojiAt(ctx, "❤️", 0, 0, f.faceW * 0.2 * pulse)));
    }) },
  { id: "dog", name: "🐶 Dog", faces: true,
    draw: (ctx, w, h, t, faces) => onFace(ctx, faces, f => {
      at(ctx, f.forehead, f.angle, () => {
        [-1, 1].forEach(side => {
          ellipse(ctx, side * f.faceW * 0.36, -f.faceH * 0.02, f.faceW * 0.15, f.faceH * 0.3, side * 0.3, "#8b5a2b");
          ellipse(ctx, side * f.faceW * 0.36, 0, f.faceW * 0.08, f.faceH * 0.2, side * 0.3, "#f2a7b8");
        });
      });
      at(ctx, f.nose, f.angle, () => {
        ellipse(ctx, 0, 0, f.faceW * 0.11, f.faceW * 0.08, 0, "#1b1b1b");
        ellipse(ctx, -f.faceW * 0.03, -f.faceW * 0.025, f.faceW * 0.03, f.faceW * 0.015, 0, "rgba(255,255,255,.6)");
      });
      if (f.mouthOpen > 0.06) at(ctx, f.mouthBottom, f.angle, () => emojiAt(ctx, "👅", 0, f.faceW * 0.1, f.faceW * (0.2 + f.mouthOpen)));
    }) },
  { id: "crown", name: "👑 Crown", faces: true,
    draw: (ctx, w, h, t, faces) => onFace(ctx, faces, f =>
      at(ctx, f.headTop, f.angle, () => emojiAt(ctx, "👑", 0, -f.faceW * 0.12, f.faceW * 0.85))) },
  { id: "clown", name: "🤡 Clown", faces: true,
    draw: (ctx, w, h, t, faces) => onFace(ctx, faces, f => {
      at(ctx, f.forehead, f.angle, () => {
        [[-0.5, "#ff4d4d"], [0.5, "#4da6ff"], [-0.32, "#ffd23f"], [0.32, "#4dd964"]].forEach(([x, c], i) =>
          ellipse(ctx, x * f.faceW, -f.faceH * (i > 1 ? 0.12 : 0.02), f.faceW * 0.2, f.faceW * 0.2, 0, c));
      });
      at(ctx, f.nose, f.angle, () => {
        ellipse(ctx, 0, 0, f.faceW * 0.12, f.faceW * 0.12, 0, "#e8202a");
        ellipse(ctx, -f.faceW * 0.04, -f.faceW * 0.04, f.faceW * 0.03, f.faceW * 0.03, 0, "rgba(255,255,255,.7)");
      });
    }) }
];
