// Real face tracking with MediaPipe Face Landmarker (478 landmarks), loaded on demand.
import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let landmarker = null;
let loading = null;
let lastTime = -1;
let cached = [];

const tracker = {
  state: "idle", // idle | loading | ready | failed

  load() {
    if (loading) return loading;
    tracker.state = "loading";
    loading = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(WASM);
      const options = (delegate) => ({
        baseOptions: { modelAssetPath: MODEL, delegate },
        runningMode: "VIDEO",
        numFaces: 2
      });
      try { landmarker = await FaceLandmarker.createFromOptions(fileset, options("GPU")); }
      catch (e) { landmarker = await FaceLandmarker.createFromOptions(fileset, options("CPU")); }
      tracker.state = "ready";
    })().catch(err => { console.error("Face tracking failed to load", err); tracker.state = "failed"; });
    return loading;
  },

  // Returns faces in (unmirrored) video pixel coordinates.
  detect(video) {
    if (tracker.state !== "ready" || !video.videoWidth) return cached;
    if (video.currentTime === lastTime) return cached;
    lastTime = video.currentTime;
    const result = landmarker.detectForVideo(video, performance.now());
    const next = (result.faceLandmarks || []).map(lm => toFace(lm, video.videoWidth, video.videoHeight));
    cached = next.map((f, i) => smooth(cached[i], f));
    return cached;
  }
};

function toFace(lm, w, h) {
  const P = i => ({ x: lm[i].x * w, y: lm[i].y * h });
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const eyeR = P(33), eyeL = P(263);          // outer eye corners (person's right/left)
  const eyes = { x: (eyeR.x + eyeL.x) / 2, y: (eyeR.y + eyeL.y) / 2 };
  const forehead = P(10), chin = P(152);
  const faceH = dist(forehead, chin);
  const faceW = dist(P(234), P(454));
  const up = { x: (forehead.x - chin.x) / faceH, y: (forehead.y - chin.y) / faceH };
  return {
    eyes, eyeR, eyeL, forehead, chin,
    headTop: { x: forehead.x + up.x * faceH * 0.18, y: forehead.y + up.y * faceH * 0.18 },
    nose: P(1),
    mouth: { x: (P(13).x + P(14).x) / 2, y: (P(13).y + P(14).y) / 2 },
    mouthBottom: P(14),
    mouthOpen: dist(P(13), P(14)) / faceH,
    angle: Math.atan2(eyeL.y - eyeR.y, eyeL.x - eyeR.x),
    faceW, faceH
  };
}

// Light smoothing so stickers do not jitter.
function smooth(prev, next, a = 0.6) {
  if (!prev) return next;
  const out = {};
  for (const k in next) {
    const v = next[k];
    if (typeof v === "number") out[k] = prev[k] + (v - prev[k]) * a;
    else out[k] = { x: prev[k].x + (v.x - prev[k].x) * a, y: prev[k].y + (v.y - prev[k].y) * a };
  }
  return out;
}

window.faceTracker = tracker;
