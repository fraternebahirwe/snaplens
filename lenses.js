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
