// Lens catalogue: tags every filter with a tab (cat) and tile art (emoji), then adds new lenses below.
// cat: basic | aesthetic | face | fun | games

const LENS_META = {
  normal: ["basic", "📷"], warm: ["aesthetic", "☀️"], cool: ["aesthetic", "🧊"], bw: ["aesthetic", "⚫"],
  vintage: ["aesthetic", "📷"], neon: ["aesthetic", "💜"], dream: ["aesthetic", "☁️"], invert: ["fun", "🌀"],
  pixel: ["fun", "👾"], hearts: ["fun", "💕"], sparkle: ["aesthetic", "✨"], snow: ["aesthetic", "❄️"],
  shades: ["face", "😎"], love: ["face", "😍"], dog: ["face", "🐶"], crown: ["face", "👑"], clown: ["face", "🤡"]
};
FILTERS.forEach(f => { const m = LENS_META[f.id]; if (m) { f.cat = m[0]; f.emoji = m[1]; } });

// Scratch copy of the current frame, used by lenses that magnify parts of the picture.
const scratch = document.createElement("canvas");
function snapshot(ctx) {
  scratch.width = ctx.canvas.width;
  scratch.height = ctx.canvas.height;
  scratch.getContext("2d").drawImage(ctx.canvas, 0, 0);
  return scratch;
}
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

// ---------- Aesthetic ----------
FILTERS.push(
  { id: "mirror", name: "Mirror", cat: "aesthetic", emoji: "🪞",
    draw: (ctx, w, h) => {
      const src = snapshot(ctx);
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(src, 0, 0, w / 2, h, 0, 0, w / 2, h); // left half reflected onto the right
      ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,.35)";
      ctx.fillRect(w / 2 - 1, 0, 2, h);
    } },

  { id: "daystamp", name: "Day Stamp", cat: "aesthetic", emoji: "📅", css: "grayscale(.8) contrast(1.15) brightness(.9)",
    draw: (ctx, w, h) => {
      const d = new Date();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255,.6)";
      ctx.font = "bold " + Math.round(w * 0.24) + "px 'Arial Narrow', Impact, sans-serif";
      ctx.fillText(d.toLocaleDateString(undefined, { weekday: "long" }).toUpperCase(), w / 2, h * 0.13);
      ctx.font = Math.round(w * 0.05) + "px sans-serif";
      ctx.fillText(d.toLocaleDateString(undefined, { day: "numeric", month: "long" }), w / 2, h * 0.21);
    } },

  { id: "film", name: "Film Grain", cat: "aesthetic", emoji: "🎞️", css: "sepia(.25) contrast(1.1) saturate(1.1)",
    draw: (ctx, w, h) => {
      for (let i = 0; i < 500; i++) {
        ctx.fillStyle = "rgba(255,255,255," + (Math.random() * 0.18).toFixed(2) + ")";
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      vignette(ctx, w, h, 0.4);
    } },

  { id: "vhs", name: "VHS", cat: "aesthetic", emoji: "📼", css: "saturate(1.5) contrast(1.15) hue-rotate(-8deg)",
    draw: (ctx, w, h, t) => {
      ctx.fillStyle = "rgba(0,0,0,.2)";
      for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
      ctx.fillStyle = "rgba(255,255,255,.1)";
      ctx.fillRect(0, (t / 8) % h, w, h * 0.04); // slow tracking bar
      ctx.fillStyle = "rgba(255,0,60,.07)";
      ctx.fillRect(0, 0, w, h);
    } },

  { id: "golden", name: "Golden Hour", cat: "aesthetic", emoji: "🌇", css: "sepia(.3) saturate(1.5) brightness(1.08)",
    draw: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "rgba(255,170,60,.55)");
      g.addColorStop(1, "rgba(255,70,120,.3)");
      ctx.globalCompositeOperation = "overlay";
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    } },

  { id: "glow", name: "Soft Glow", cat: "aesthetic", emoji: "🌸", css: "brightness(1.06) saturate(1.1)",
    draw: (ctx, w, h) => {
      const src = snapshot(ctx);
      ctx.globalAlpha = 0.45;
      ctx.filter = "blur(10px) brightness(1.15)"; // ignored where ctx.filter is unsupported
      ctx.drawImage(src, 0, 0);
      ctx.filter = "none";
      ctx.globalAlpha = 1;
    } }
);
