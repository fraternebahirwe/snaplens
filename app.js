(function () {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const filtersEl = document.getElementById("filters");
  const shutter = document.getElementById("shutter");
  const message = document.getElementById("message");
  const recBadge = document.getElementById("rec");
  const timerEl = document.getElementById("timer");
  const preview = document.getElementById("preview");
  const previewImg = document.getElementById("previewImg");
  const previewVid = document.getElementById("previewVid");
  const saveLink = document.getElementById("save");

  const MAX_VIDEO_SECONDS = 60;
  const HOLD_MS = 350;

  let stream = null;
  let facing = "user";
  let current = FILTERS[0];
  let faces = [];
  let detector = null;
  let detecting = false;
  let lastDetect = 0;
  const supportsCtxFilter = "filter" in ctx;
  const small = document.createElement("canvas");

  // ---------- UI ----------
  function showMessage(text) { message.textContent = text; message.hidden = !text; }

  FILTERS.forEach(f => {
    const b = document.createElement("button");
    b.className = "chip" + (f === current ? " active" : "");
    b.textContent = f.name;
    b.setAttribute("role", "option");
    b.addEventListener("click", () => {
      current = f;
      document.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", c === b));
      b.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
    });
    filtersEl.appendChild(b);
  });

  // ---------- Camera ----------
  async function startCamera() {
    if (stream) stream.getTracks().forEach(t => t.stop());
    const base = { video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } } };
    try {
      stream = await navigator.mediaDevices.getUserMedia({ ...base, audio: true });
    } catch (e) {
      try { stream = await navigator.mediaDevices.getUserMedia(base); } // no microphone: video still works
      catch (err) {
        showMessage("Camera blocked. Allow camera access in your browser, then reload.");
        return;
      }
    }
    showMessage(supportsCtxFilter ? "" : "Your browser does not support colour filters. Use Chrome or Firefox for the full set; stickers still work.");
    if (!supportsCtxFilter) setTimeout(() => showMessage(""), 5000);
    video.srcObject = stream;
    await video.play();
    if ("FaceDetector" in window && !detector) {
      try { detector = new FaceDetector({ fastMode: true, maxDetectedFaces: 3 }); } catch (e) { detector = null; }
    }
  }

  document.getElementById("flip").addEventListener("click", () => {
    facing = facing === "user" ? "environment" : "user";
    startCamera();
  });

  async function detectFaces(now) {
    if (!detector || detecting || now - lastDetect < 120) return;
    detecting = true; lastDetect = now;
    try { faces = (await detector.detect(video)).map(f => f.boundingBox); } catch (e) { faces = []; }
    detecting = false;
  }

  // ---------- Rendering ----------
  function render(now) {
    requestAnimationFrame(render);
    const vw = video.videoWidth, vh = video.videoHeight;
    if (!vw) return;
    if (canvas.width !== vw || canvas.height !== vh) { canvas.width = vw; canvas.height = vh; }
    const mirror = facing === "user";
    if (current.faces) detectFaces(now);

    ctx.save();
    if (mirror) { ctx.translate(vw, 0); ctx.scale(-1, 1); }
    if (current.pixel) {
      small.width = Math.max(8, Math.round(vw * current.pixel));
      small.height = Math.max(8, Math.round(vh * current.pixel));
      small.getContext("2d").drawImage(video, 0, 0, small.width, small.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(small, 0, 0, vw, vh);
      ctx.imageSmoothingEnabled = true;
    } else {
      if (supportsCtxFilter && current.css) ctx.filter = current.css;
      ctx.drawImage(video, 0, 0, vw, vh);
      ctx.filter = "none";
    }
    ctx.restore();

    if (current.draw) {
      // face boxes come from the unmirrored video; flip x when the preview is mirrored
      const fs = mirror ? faces.map(f => ({ x: vw - f.x - f.width, y: f.y, width: f.width, height: f.height })) : faces;
      ctx.save();
      current.draw(ctx, vw, vh, now, fs);
      ctx.restore();
    }
  }

  // ---------- Capture ----------
  function showPreview(kind, blob) {
    const url = URL.createObjectURL(blob);
    previewImg.hidden = kind !== "photo";
    previewVid.hidden = kind !== "video";
    if (kind === "photo") { previewImg.src = url; }
    else { previewVid.src = url; previewVid.play().catch(() => {}); }
    const ext = kind === "photo" ? "png" : (blob.type.includes("mp4") ? "mp4" : "webm");
    saveLink.href = url;
    saveLink.download = "snaplens-" + Date.now() + "." + ext;
    preview.hidden = false;
  }

  document.getElementById("discard").addEventListener("click", () => {
    previewVid.pause();
    URL.revokeObjectURL(saveLink.href);
    previewImg.removeAttribute("src");
    previewVid.removeAttribute("src");
    preview.hidden = true;
  });

  function takePhoto() {
    canvas.toBlob(b => b && showPreview("photo", b), "image/png");
  }

  let recorder = null, chunks = [], recStart = 0, recTick = null;

  function pickMime() {
    const options = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
    return options.find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || "";
  }

  function startRecording() {
    if (!window.MediaRecorder) { showMessage("Video recording is not supported in this browser."); return false; }
    const out = canvas.captureStream(30);
    stream.getAudioTracks().forEach(t => out.addTrack(t));
    const mime = pickMime();
    recorder = new MediaRecorder(out, mime ? { mimeType: mime } : undefined);
    chunks = [];
    recorder.ondataavailable = e => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
      if (blob.size) showPreview("video", blob);
    };
    recorder.start(250);
    recStart = Date.now();
    recBadge.hidden = false;
    shutter.classList.add("recording");
    recTick = setInterval(() => {
      const s = Math.floor((Date.now() - recStart) / 1000);
      timerEl.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
      if (s >= MAX_VIDEO_SECONDS) stopRecording();
    }, 250);
    return true;
  }

  function stopRecording() {
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
    clearInterval(recTick);
    recBadge.hidden = true;
    shutter.classList.remove("recording");
    timerEl.textContent = "0:00";
  }

  // tap = photo, hold = video
  let holdTimer = null, holding = false;
  shutter.addEventListener("pointerdown", e => {
    shutter.setPointerCapture(e.pointerId);
    holding = false;
    holdTimer = setTimeout(() => { holding = startRecording(); }, HOLD_MS);
  });
  function release() {
    clearTimeout(holdTimer);
    if (holding) { stopRecording(); holding = false; }
    else if (video.videoWidth) takePhoto();
  }
  shutter.addEventListener("pointerup", release);
  shutter.addEventListener("pointercancel", () => { clearTimeout(holdTimer); if (holding) { stopRecording(); holding = false; } });
  shutter.addEventListener("contextmenu", e => e.preventDefault());

  // ---------- Shortcuts and swipe ----------
  function selectFilter(delta) {
    const i = (FILTERS.indexOf(current) + delta + FILTERS.length) % FILTERS.length;
    document.querySelectorAll(".chip")[i].click();
  }
  window.addEventListener("keydown", e => {
    if (!preview.hidden) return;
    if (e.key === " " && !e.repeat) { e.preventDefault(); if (video.videoWidth) takePhoto(); }
    if (e.key === "ArrowRight") selectFilter(1);
    if (e.key === "ArrowLeft") selectFilter(-1);
  });
  let swipeX = null;
  canvas.addEventListener("pointerdown", e => { swipeX = e.clientX; });
  canvas.addEventListener("pointerup", e => {
    if (swipeX !== null && Math.abs(e.clientX - swipeX) > 60) selectFilter(e.clientX < swipeX ? 1 : -1);
    swipeX = null;
  });

  // ---------- Go ----------
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showMessage("This browser cannot open the camera. Serve the page from http://localhost or https.");
  } else {
    startCamera();
  }
  requestAnimationFrame(render);
})();
