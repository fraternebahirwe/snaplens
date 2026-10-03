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

function onFace(ctx, w, h, faces, fn) {
  const list = faces && faces.length ? faces : [{ x: w * 0.3, y: h * 0.25, width: w * 0.4, height: w * 0.4 }];
  list.forEach(f => fn(f.x + f.width / 2, f.y + f.height / 2, f.width, f.height));
}

function emojiAt(ctx, e, x, y, size) {
  ctx.font = size + "px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(e, x, y);
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
    draw: (ctx, w, h, t, faces) => onFace(ctx, w, h, faces, (cx, cy, fw) => emojiAt(ctx, "🕶️", cx, cy - fw * 0.08, fw * 0.95)) },
  { id: "dog", name: "🐶 Dog", faces: true,
    draw: (ctx, w, h, t, faces) => onFace(ctx, w, h, faces, (cx, cy, fw, fh) => {
      emojiAt(ctx, "🐶", cx, cy - fh * 0.55, fw * 0.8);
      emojiAt(ctx, "👅", cx, cy + fh * 0.35, fw * 0.3);
    }) },
  { id: "crown", name: "👑 Crown", faces: true,
    draw: (ctx, w, h, t, faces) => onFace(ctx, w, h, faces, (cx, cy, fw, fh) => emojiAt(ctx, "👑", cx, cy - fh * 0.62, fw * 0.8)) },
  { id: "clown", name: "🤡 Clown", faces: true,
    draw: (ctx, w, h, t, faces) => onFace(ctx, w, h, faces, (cx, cy, fw, fh) => {
      emojiAt(ctx, "🔴", cx, cy + fh * 0.05, fw * 0.22);
      emojiAt(ctx, "🌈", cx, cy - fh * 0.62, fw * 0.9);
    }) }
];
