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

// ---------- Face lenses ----------
// Magnify a patch of the live picture around a point (big mouth, bug eyes).
function magnify(ctx, src, p, rx, ry, zoom, rot) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * zoom, ry * zoom, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.rotate(-rot);
  ctx.drawImage(src, p.x - rx, p.y - ry, rx * 2, ry * 2, -rx * zoom, -ry * zoom, rx * 2 * zoom, ry * 2 * zoom);
  ctx.restore();
}

FILTERS.push(
  { id: "bigmouth", name: "Big Mouth", cat: "face", emoji: "👄", faces: true,
    draw: (ctx, w, h, t, faces) => {
      const src = snapshot(ctx);
      faces.forEach(f => magnify(ctx, src, f.mouth, f.faceW * 0.2, f.faceW * (0.1 + f.mouthOpen * 0.4), 1.9, f.angle));
    } },

  { id: "bugeyes", name: "Bug Eyes", cat: "face", emoji: "👀", faces: true,
    draw: (ctx, w, h, t, faces) => {
      const src = snapshot(ctx);
      faces.forEach(f => [f.eyeL, f.eyeR].forEach(e => magnify(ctx, src, e, f.faceW * 0.12, f.faceW * 0.1, 2.1, f.angle)));
    } },

  { id: "panda", name: "Panda", cat: "face", emoji: "🐼", faces: true,
    draw: (ctx, w, h, t, faces) => faces.forEach(f => {
      at(ctx, f.forehead, f.angle, () => {
        [-1, 1].forEach(s => ellipse(ctx, s * f.faceW * 0.42, -f.faceH * 0.04, f.faceW * 0.14, f.faceW * 0.14, 0, "#151515"));
      });
      at(ctx, { x: (f.forehead.x + f.chin.x) / 2, y: (f.forehead.y + f.chin.y) / 2 }, f.angle, () =>
        ellipse(ctx, 0, 0, f.faceW * 0.52, f.faceH * 0.56, 0, "rgba(255,255,255,.38)"));
      [[f.eyeL, 1], [f.eyeR, -1]].forEach(([e, s]) => at(ctx, e, f.angle, () => {
        ellipse(ctx, 0, f.faceW * 0.02, f.faceW * 0.1, f.faceW * 0.15, s * 0.35, "rgba(15,15,15,.9)");
        ellipse(ctx, 0, 0, f.faceW * 0.025, f.faceW * 0.025, 0, "#fff");
      }));
      at(ctx, f.nose, f.angle, () => ellipse(ctx, 0, 0, f.faceW * 0.1, f.faceW * 0.065, 0, "#151515"));
    }) },

  { id: "bunny", name: "Bunny", cat: "face", emoji: "🐰", faces: true,
    draw: (ctx, w, h, t, faces) => faces.forEach(f => {
      at(ctx, f.headTop, f.angle, () => {
        [-1, 1].forEach(s => {
          ellipse(ctx, s * f.faceW * 0.22, -f.faceH * 0.38, f.faceW * 0.12, f.faceH * 0.42, s * 0.12, "rgba(255,255,255,.95)");
          ellipse(ctx, s * f.faceW * 0.22, -f.faceH * 0.34, f.faceW * 0.06, f.faceH * 0.3, s * 0.12, "#ffb3c7");
        });
      });
      at(ctx, f.eyes, f.angle, () => emojiAt(ctx, "🕶️", 0, 0, f.faceW * 0.95));
      at(ctx, f.nose, f.angle, () => ellipse(ctx, 0, 0, f.faceW * 0.05, f.faceW * 0.035, 0, "#ff8fab"));
    }) },

  { id: "oldman", name: "Old Man", cat: "face", emoji: "👴", faces: true, css: "contrast(1.08) saturate(.85)",
    draw: (ctx, w, h, t, faces) => faces.forEach(f => {
      const d = dist(f.mouthBottom, f.chin);
      at(ctx, f.mouthBottom, f.angle, () => ellipse(ctx, 0, d * 0.55, f.faceW * 0.36, d * 0.85, 0, "rgba(242,242,242,.93)"));
      at(ctx, f.mouth, f.angle, () => [-1, 1].forEach(s =>
        ellipse(ctx, s * f.faceW * 0.1, -f.faceH * 0.06, f.faceW * 0.12, f.faceW * 0.04, -s * 0.3, "rgba(242,242,242,.95)")));
      [f.eyeL, f.eyeR].forEach(e => at(ctx, e, f.angle, () =>
        ellipse(ctx, 0, -f.faceW * 0.15, f.faceW * 0.1, f.faceW * 0.035, 0, "rgba(240,240,240,.95)")));
    }) }
);

// ---------- Games (played with your face) ----------
function makeGame({ emojis, dir, hit, ok, label }) {
  let items = [], score = 0, last = 0, spawn = 0;
  return {
    init() { items = []; score = 0; last = 0; spawn = 0; },
    draw(ctx, w, h, t, faces) {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      spawn -= dt;
      if (spawn <= 0 && items.length < 6) {
        spawn = 0.8 + Math.random() * 0.7;
        items.push({ x: w * (0.12 + Math.random() * 0.76), y: dir > 0 ? -40 : h + 40, e: emojis[Math.floor(Math.random() * emojis.length)] });
      }
      items.forEach(it => { it.y += dir * h * 0.22 * dt; });
      items = items.filter(it => {
        if (dir > 0 ? it.y > h + 60 : it.y < -60) return false;
        for (const f of faces) {
          if (ok(f) && dist(hit(f), it) < f.faceW * 0.3) { score++; return false; }
        }
        return true;
      });
      items.forEach(it => emojiAt(ctx, it.e, it.x, it.y, w * 0.12));
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold " + Math.round(w * 0.07) + "px sans-serif";
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(0,0,0,.6)";
      ctx.fillStyle = "#fff";
      const text = label + ": " + score + (faces.length ? "" : "  (show your face)");
      ctx.strokeText(text, w / 2, h * 0.1);
      ctx.fillText(text, w / 2, h * 0.1);
    }
  };
}

FILTERS.push(
  { id: "munch", name: "Mouth Munch", cat: "games", emoji: "🍕", faces: true,
    ...makeGame({ emojis: ["🍕", "🍔", "🍟", "🍩", "🍪"], dir: 1, hit: f => f.mouth, ok: f => f.mouthOpen > 0.07, label: "Eaten" }) },
  { id: "popit", name: "Pop It", cat: "games", emoji: "🎈", faces: true,
    ...makeGame({ emojis: ["🎈", "🎈", "🎉", "⭐"], dir: -1, hit: f => f.nose, ok: () => true, label: "Popped" }) }
);
