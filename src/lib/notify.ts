// Platform-wide notification sound + browser notification.
// Deliberately loud, clear and long (a 3-note ascending chime, ~1s) rather than
// a short blip — used by admin reports and by both sides of chat.

let sharedCtx: AudioContext | null = null;
function ctx(): AudioContext | null {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!sharedCtx) sharedCtx = new Ctx();
    if (sharedCtx.state === "suspended") void sharedCtx.resume();
    return sharedCtx;
  } catch { return null; }
}

export function playChime() {
  const c = ctx();
  if (!c) return;
  const now = c.currentTime;
  // Ascending triad, each note held so the sound is clear and not clipped short.
  const notes = [
    { f: 587.33, t: 0 },     // D5
    { f: 783.99, t: 0.16 },  // G5
    { f: 1046.5, t: 0.32 },  // C6
  ];
  const master = c.createGain();
  master.gain.value = 1;
  master.connect(c.destination);
  for (const n of notes) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "triangle";
    o.frequency.value = n.f;
    o.connect(g); g.connect(master);
    const s = now + n.t;
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(0.32, s + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, s + 0.6);
    o.start(s);
    o.stop(s + 0.65);
  }
}

// Ask once (call after a user gesture ideally). Safe to call repeatedly.
export function requestNotify() {
  try { if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission(); } catch { /* ignore */ }
}

export function notify(title: string, body?: string) {
  playChime();
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification(title, { body: body ?? "" });
  } catch { /* ignore */ }
}
