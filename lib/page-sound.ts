"use client";

/**
 * The sound of a page turning, synthesised rather than downloaded.
 *
 * A paper rustle is filtered noise with a fast attack and a short decay, which
 * the Web Audio API can make in a dozen lines. Doing it this way costs no
 * network request, no asset to host, and no licence — and it can be detuned
 * slightly on every turn so twenty pages do not sound like the same click
 * twenty times.
 *
 * The context is created on the first turn, never at import: browsers refuse
 * to start audio before a gesture, and creating one unprompted is exactly the
 * kind of thing that gets a site flagged as noisy.
 */

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noiseBuffer(audio: AudioContext): AudioBuffer {
  if (noise) return noise;
  const length = Math.floor(audio.sampleRate * 0.4);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  // Brown-ish noise: softer and more paper-like than flat white noise.
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.035 * white) / 1.035;
    data[i] = last * 3.2;
  }
  noise = buffer;
  return buffer;
}

export function playPageTurn() {
  const audio = context();
  if (!audio) return;

  try {
    const source = audio.createBufferSource();
    source.buffer = noiseBuffer(audio);
    source.playbackRate.value = 0.85 + Math.random() * 0.3;

    // A sweeping band-pass is what turns a hiss into a rustle: the brightness
    // rises as the sheet passes the spine and falls as it settles.
    const band = audio.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 0.8;
    const now = audio.currentTime;
    band.frequency.setValueAtTime(900, now);
    band.frequency.exponentialRampToValueAtTime(2600, now + 0.1);
    band.frequency.exponentialRampToValueAtTime(700, now + 0.3);

    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

    source.connect(band).connect(gain).connect(audio.destination);
    source.start(now);
    source.stop(now + 0.36);
  } catch {
    /* Audio is a flourish. It never gets to interrupt reading. */
  }
}
