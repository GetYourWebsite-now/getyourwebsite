/**
 * The stage (V2.1 §1) and the camera (§3).
 *
 *   - Dark throughout: #0a0a0c, the site's footer colour. Never pure black.
 *   - One indigo light: a #2f3dd6 radial about 40% of the frame, 18%
 *     opacity, blurred, drifting slowly — and moving with the camera at
 *     0.4×, so it is the far layer of the parallax.
 *   - Grain over everything at 6%, a new offset of the noise tile every
 *     frame, so no frame is ever identical to another, even on a hold.
 *
 * The camera is a transform of the world layer: scale `s` about the point
 * (px, py), which sits at the centre of the frame. A scene describes its
 * camera as a function of time (see `Scene.camera`); the default is the
 * push-in every hold gets, 1.00 → 1.06.
 */
import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import grain from '../../assets/stage/grain.png';
import { ACCENT, FPS } from '../script.ts';
import { clamp } from '../kit.tsx';
import { BAND_TOP, FORMATS } from '../sizes.ts';

export const STAGE = '#0a0a0c';
/** Type on the stage: never pure white. */
export const ON_STAGE = '#f6f7f9';

/** §2's spring, used for everything that lands: a little overshoot. */
export const SPRING = { damping: 16, stiffness: 120, mass: 0.9 };
/** 0 → 1 (with overshoot) starting `at` seconds into the current sequence. */
export const springAt = (frame: number, at: number, config = SPRING) =>
  spring({ frame: frame - Math.round(at * FPS), fps: FPS, config });

export type Camera = { s: number; px: number; py: number };
export const restCamera = (W: number, H: number): Camera => ({ s: 1, px: W / 2, py: H / 2 });

/** The world transform for a camera. */
export const cameraTransform = (c: Camera, W: number, H: number) =>
  `translate(${W / 2 - c.px * c.s}px, ${H / 2 - c.py * c.s}px) scale(${c.s})`;

/** Default camera: the slow push-in on a hold. */
export const pushIn = (t: number, dur: number, W: number, H: number, to = 1.06): Camera =>
  ({ s: interpolate(t, [0, dur], [1, to], clamp), px: W / 2, py: H / 2 });

/**
 * A camera at scale `s` that puts the world point (x, y) in the middle of
 * the picture's usable area: in 16:9 the frame above the caption band, in
 * 9:16 the band between the caption and the bottom safe line.
 */
export function focus(W: number, H: number, x: number, y: number, s: number): Camera {
  const portrait = H > W;
  const P = FORMATS.portrait.stage;
  const top = portrait ? P.y : 0, bottom = portrait ? P.y + P.h : BAND_TOP;
  return { s, px: x, py: y - ((top + bottom) / 2 - H / 2) / s };
}

/** The deepest camera, up to `maxS`, that keeps the screen box `b` (at
 *  s = 1) whole inside the usable area with `margin` round it, centred. */
export function focusBox(W: number, H: number, b: { x: number; y: number; w: number; h: number }, maxS: number, margin = 48): Camera {
  const portrait = H > W;
  const P = FORMATS.portrait.stage;
  const top = portrait ? P.y : 0, bottom = portrait ? P.y + P.h : BAND_TOP;
  const s = Math.max(1, Math.min(maxS, (W - 2 * margin) / b.w, (bottom - top - 2 * margin) / b.h));
  return focus(W, H, b.x + b.w / 2, b.y + b.h / 2, s);
}

/** Blend two cameras by a spring value p (0 = a, 1 = b). */
export const blend = (a: Camera, b: Camera, p: number): Camera =>
  ({ s: a.s + (b.s - a.s) * p, px: a.px + (b.px - a.px) * p, py: a.py + (b.py - a.py) * p });

/** The far layer: the stage colour and the indigo light. `cam` is where the
 *  world's camera is; `shift` is a whip pan's horizontal offset. */
export const StageBack: React.FC<{ cam: Camera; shift?: number }> = ({ cam, shift = 0 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const t = frame / FPS;
  const size = Math.max(W, H) * 0.62; // the light's diameter: ~40% of the frame's area
  // How far the camera has moved the world on screen; the light goes 0.4× as far.
  const worldX = (W / 2 - cam.px) * cam.s + shift, worldY = (H / 2 - cam.py) * cam.s;
  const dx = Math.sin(t * 0.37) * W * 0.06 + worldX * 0.4;
  const dy = Math.cos(t * 0.29) * H * 0.05 + worldY * 0.4;
  const cx = W * 0.6 + dx, cy = H * 0.42 + dy;
  return (
    <AbsoluteFill style={{ background: STAGE, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute', left: cx - size / 2, top: cy - size / 2, width: size, height: size, borderRadius: '50%',
          background: `radial-gradient(circle, ${ACCENT} 0%, rgba(47,61,214,0) 70%)`,
          opacity: 0.18, filter: 'blur(60px)', transform: `scale(${0.9 + (cam.s - 1) * 0.4})`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Grain over everything at 6%: the tile moves to a new offset every frame. */
export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  // A deterministic hop per frame (the same render twice is identical).
  const ox = (frame * 7919) % 512, oy = (frame * 104729) % 512;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden', opacity: 0.06, mixBlendMode: 'overlay' }}>
      <div style={{ position: 'absolute', left: -ox, top: -oy, right: -512, bottom: -512, backgroundImage: `url(${grain})`, backgroundRepeat: 'repeat', backgroundSize: '512px 512px' }} />
      {/* Loaded through <Img> too, so every frame waits for the tile. */}
      <Img src={grain} style={{ display: 'none' }} />
    </AbsoluteFill>
  );
};

/** The world layer, under the camera. */
export const World: React.FC<{ cam: Camera; shift?: number; children: React.ReactNode }> = ({ cam, shift = 0, children }) => {
  const { width: W, height: H } = useVideoConfig();
  return (
    <AbsoluteFill style={{ transform: `translateX(${shift}px)` }}>
      <AbsoluteFill style={{ transformOrigin: '0 0', transform: cameraTransform(cam, W, H) }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
