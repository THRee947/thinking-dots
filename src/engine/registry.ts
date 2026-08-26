// Mode key → geometry builder. Kept separate from the presets so tree
// shaking can in principle drop unused modes in custom builds.

import type { ModeKey } from '../presets';
import type { ModeDraw, ModeFrame } from './types';
import { paintFrame } from './core';
import { frameBraid } from './braid';
import { frameGlobe, frameRubik, frameWave } from './lattice';
import { frameMorph } from './morph';
import { frameOrbits } from './orbits';
import { frameRibbon } from './ribbon';
import { frameWeb } from './web';
import { drawBlackHole } from './blackhole';

/**
 * The portable surface: pure geometry, no canvas. The React Native port
 * imports exactly these functions, so its output is identical to the web's
 * by construction rather than by re-implementation.
 */
export const MODE_FRAMES: Record<ModeKey, ModeFrame> = {
  // Black-hole rendering is canvas-specific; keep a portable fallback so
  // the existing native geometry contract remains complete.
  blackhole: frameOrbits,
  orbits: frameOrbits,
  globe: frameGlobe,
  rubik: frameRubik,
  wave: frameWave,
  web: frameWeb,
  braid: frameBraid,
  ribbon: frameRibbon,
  // ring shares ribbon's geometry — the `faceOn` profile flag switches it
  ring: frameRibbon,
  morph: frameMorph
};

/** Canvas painters, derived from the geometry. The 2D-canvas binding. */
export const MODE_DRAWS: Record<ModeKey, ModeDraw> = Object.fromEntries(
  Object.entries(MODE_FRAMES).map(([key, frame]) => [
    key,
    ((ctx, size, t, dark, opts) => paintFrame(ctx, frame(size, t, opts), dark)) as ModeDraw
  ])
) as Record<ModeKey, ModeDraw>;

// The black-hole mode uses layered canvas strokes rather than the shared
// grayscale dot painter so its accretion disk can carry a restrained glow.
MODE_DRAWS.blackhole = drawBlackHole;
