"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { AD_CATEGORIES, createAdTexture } from "./adTexture";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  FROM DISCOVERY TO CONNECTION
 *
 *  A scroll-driven scene showing what Vaaram actually does: loose
 *  advertisements are gathered, laid out into pages, and bound into the week's
 *  edition.
 *
 *  Every object on screen means something — there are no decorative shapes.
 *  Each card is a real, legible advertisement drawn at runtime.
 *
 *  Stages, driven by a 0…1 scroll progress:
 *    0.00  Scattered   — individual advertisements arrive, unsorted
 *    0.33  Organising  — they turn to face the same way and gather
 *    0.66  Laid out    — they align into the grid of a printed page
 *    1.00  Bound       — the pages stack into one magazine
 * ─────────────────────────────────────────────────────────────────────────────
 */

const CARD_COUNT = 18;
const CARD_W = 0.78;
const CARD_H = 1.04;

type Layout = { position: THREE.Vector3; rotation: THREE.Euler };

/** Deterministic pseudo-random, so the composition is identical every load. */
function seeded(i: number, salt = 1) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Where card `i` sits at each stage of the story. */
function layouts(i: number): Layout[] {
  const r = (salt: number) => seeded(i, salt) * 2 - 1;

  // 0 — scattered through space, every card at its own angle
  const scattered = {
    position: new THREE.Vector3(r(1) * 4.6, r(2) * 2.8, r(3) * 2.6 - 0.6),
    rotation: new THREE.Euler(r(4) * 0.9, r(5) * 1.2, r(6) * 0.8),
  };

  // 1 — turned to face the reader, drifting together
  const organising = {
    position: new THREE.Vector3(r(7) * 3.0, r(8) * 1.7, r(9) * 0.8),
    rotation: new THREE.Euler(r(10) * 0.16, r(11) * 0.2, r(12) * 0.1),
  };

  // 2 — the grid of a page: 6 columns × 3 rows
  const col = i % 6;
  const row = Math.floor(i / 6);
  const laidOut = {
    position: new THREE.Vector3((col - 2.5) * 0.86, (1 - row) * 1.14, 0),
    rotation: new THREE.Euler(0, 0, 0),
  };

  // 3 — bound: the cards collapse into one stack of pages
  const bound = {
    position: new THREE.Vector3(
      seeded(i, 13) * 0.02 - 0.01,
      seeded(i, 14) * 0.02 - 0.01,
      -i * 0.016
    ),
    rotation: new THREE.Euler(0, 0, (seeded(i, 15) - 0.5) * 0.02),
  };

  return [scattered, organising, laidOut, bound];
}

function AdCard({ index, progress }: { index: number; progress: React.RefObject<number> }) {
  const mesh = useRef<THREE.Mesh>(null);
  const stages = useMemo(() => layouts(index), [index]);
  const category = AD_CATEGORIES[index % AD_CATEGORIES.length];

  const texture = useMemo(() => createAdTexture(category, index + 1), [category, index]);
  useEffect(() => () => texture.dispose(), [texture]);

  // Scratch objects, reused every frame so the render loop allocates nothing.
  const pos = useMemo(() => new THREE.Vector3(), []);
  const rot = useMemo(() => new THREE.Euler(), []);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    const p = THREE.MathUtils.clamp(progress.current ?? 0, 0, 1);

    // Locate the pair of stages this progress falls between.
    const scaled = p * (stages.length - 1);
    const from = Math.min(Math.floor(scaled), stages.length - 2);
    const local = scaled - from;
    // Smoothstep the blend so each stage settles rather than arriving linearly.
    const t = local * local * (3 - 2 * local);

    pos.lerpVectors(stages[from].position, stages[from + 1].position, t);
    rot.set(
      THREE.MathUtils.lerp(stages[from].rotation.x, stages[from + 1].rotation.x, t),
      THREE.MathUtils.lerp(stages[from].rotation.y, stages[from + 1].rotation.y, t),
      THREE.MathUtils.lerp(stages[from].rotation.z, stages[from + 1].rotation.z, t)
    );

    // A slow drift while the cards are still loose, fading out as they settle.
    const drift = 1 - THREE.MathUtils.clamp(p * 1.6, 0, 1);
    const time = performance.now() * 0.00018;
    pos.y += Math.sin(time * 2 + index) * 0.14 * drift;
    pos.x += Math.cos(time * 1.6 + index * 0.7) * 0.08 * drift;

    // Critically damped follow, so a fast scroll never snaps.
    const k = 1 - Math.pow(0.0015, delta);
    mesh.current.position.lerp(pos, k);
    mesh.current.rotation.x += (rot.x - mesh.current.rotation.x) * k;
    mesh.current.rotation.y += (rot.y - mesh.current.rotation.y) * k;
    mesh.current.rotation.z += (rot.z - mesh.current.rotation.z) * k;
  });

  return (
    <mesh ref={mesh} castShadow receiveShadow>
      <boxGeometry args={[CARD_W, CARD_H, 0.008]} />
      {/* Printed card stock: matte face, minimal specular, plain white edges. */}
      <meshStandardMaterial
        attach="material-4"
        map={texture}
        roughness={0.85}
        metalness={0}
      />
      <meshStandardMaterial attach="material-0" color="#e8e2d8" roughness={0.9} />
      <meshStandardMaterial attach="material-1" color="#e8e2d8" roughness={0.9} />
      <meshStandardMaterial attach="material-2" color="#f3efe8" roughness={0.9} />
      <meshStandardMaterial attach="material-3" color="#d3cabc" roughness={0.9} />
      <meshStandardMaterial attach="material-5" color="#cfc7ba" roughness={0.9} />
    </mesh>
  );
}

/**
 * Frames each stage properly rather than sliding the camera in one straight
 * line: the scatter needs width, the laid-out page needs to fit edge to edge,
 * and the bound magazine deserves to be come in close on.
 */
const CAMERA_STAGES: [number, number][] = [
  // [z, y] for scattered, organising, laid out, bound
  [7.2, 0.05],
  [6.6, 0.15],
  [6.2, 0.1],
  [3.4, 0.3],
];

function Rig({ progress }: { progress: React.RefObject<number> }) {
  const { camera } = useThree();

  useFrame((_, delta) => {
    const p = THREE.MathUtils.clamp(progress.current ?? 0, 0, 1);
    const scaled = p * (CAMERA_STAGES.length - 1);
    const from = Math.min(Math.floor(scaled), CAMERA_STAGES.length - 2);
    const local = scaled - from;
    const t = local * local * (3 - 2 * local);

    const z = THREE.MathUtils.lerp(CAMERA_STAGES[from][0], CAMERA_STAGES[from + 1][0], t);
    const y = THREE.MathUtils.lerp(CAMERA_STAGES[from][1], CAMERA_STAGES[from + 1][1], t);

    const k = 1 - Math.pow(0.02, delta);
    camera.position.z += (z - camera.position.z) * k;
    camera.position.y += (y - camera.position.y) * k;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function AdvertisementScene({
  progress,
}: {
  progress: React.RefObject<number>;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <Canvas
      // Capped device pixel ratio: a 3× phone screen would otherwise render
      // nine times the pixels for no visible gain.
      dpr={[1, 1.75]}
      shadows
      camera={{ position: [0, 0.05, 7.2], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      onError={() => setFailed(true)}
      className="!absolute inset-0"
    >
      {/* Studio lighting: a soft ambient base, one key light casting the
          shadow, and a cool rim to separate cards from the background. */}
      <ambientLight intensity={0.75} />
      <directionalLight
        position={[3.5, 5, 4]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
      />
      <directionalLight position={[-4, 1.5, -3]} intensity={0.5} color="#cfd8e8" />

      {Array.from({ length: CARD_COUNT }, (_, i) => (
        <AdCard key={i} index={i} progress={progress} />
      ))}

      <ContactShadows
        position={[0, -2.4, 0]}
        opacity={0.32}
        scale={11}
        blur={2.6}
        far={4}
        resolution={512}
      />

      <Rig progress={progress} />
    </Canvas>
  );
}
