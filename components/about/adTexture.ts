import * as THREE from "three";

/**
 * Draws a miniature advertisement onto a canvas and returns it as a texture.
 *
 * Generating these at runtime rather than shipping images means the 3D scene
 * adds no network weight at all, and every card is legibly an *advertisement*
 * — a category, a headline and a few lines of copy — which is the whole point
 * of the scene.
 */

export type AdCategory = {
  label: string;
  /** Card stock colour. */
  paper: string;
  /** Type colour. */
  ink: string;
  /** Rule and highlight colour. */
  accent: string;
};

export const AD_CATEGORIES: AdCategory[] = [
  { label: "PROPERTY", paper: "#f7f4ee", ink: "#1e151a", accent: "#8a1332" },
  { label: "SERVICES", paper: "#150d11", ink: "#faf8f4", accent: "#e0b29b" },
  { label: "BUSINESS", paper: "#f3efe8", ink: "#1e151a", accent: "#b07a5c" },
  { label: "JOBS", paper: "#8a1332", ink: "#fdf1f3", accent: "#e0b29b" },
  { label: "OFFERS", paper: "#eee4da", ink: "#1e151a", accent: "#8a1332" },
  { label: "COMMUNITY", paper: "#1e151a", ink: "#f3efe8", accent: "#e0b29b" },
];

const W = 256;
const H = 340;

export function createAdTexture(category: AdCategory, seed: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Deterministic per-card variation, so a re-render never reshuffles a card.
  let s = (seed * 9301 + 49297) % 233280;
  const rand = () => (s = (s * 9301 + 49297) % 233280) / 233280;

  ctx.fillStyle = category.paper;
  ctx.fillRect(0, 0, W, H);

  // Category strap
  ctx.fillStyle = category.accent;
  ctx.fillRect(20, 22, 52, 3);
  ctx.font = "700 13px Helvetica, Arial, sans-serif";
  ctx.fillStyle = category.accent;
  ctx.letterSpacing = "2px";
  ctx.fillText(category.label, 20, 48);

  // Headline: two or three heavy rules standing in for a display line.
  ctx.fillStyle = category.ink;
  const headlineLines = 2 + Math.round(rand());
  for (let i = 0; i < headlineLines; i++) {
    ctx.fillRect(20, 72 + i * 20, (W - 40) * (0.55 + rand() * 0.42), 11);
  }

  // A photograph or logo block.
  const blockTop = 72 + headlineLines * 20 + 14;
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = category.ink;
  ctx.fillRect(20, blockTop, W - 40, 96);
  ctx.globalAlpha = 1;
  ctx.fillStyle = category.accent;
  ctx.fillRect(20, blockTop, 4, 96);

  // Body copy
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = category.ink;
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(20, blockTop + 116 + i * 13, (W - 40) * (0.5 + rand() * 0.48), 5);
  }
  ctx.globalAlpha = 1;

  // Contact strip — every advertisement ends with a way to reach the business.
  ctx.fillStyle = category.accent;
  ctx.fillRect(20, H - 46, 96, 22);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = category.ink;
  ctx.fillRect(126, H - 40, 84, 9);
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
