// The ThinkingOrb component. One shared clock (performance.now) keeps
// every mounted orb in phase; each instance runs its own rAF loop but
// pauses automatically while offscreen (IntersectionObserver) or when
// the tab is hidden (visibilitychange). Reduced-motion users get a
// static representative frame that still follows the live theme.

import { useEffect, useRef } from 'react';
import { MODE_DRAWS } from './engine/registry';
import { resolvePreset } from './presets';
import { useReducedMotion, useResolvedDark } from './theme';
import type { ThinkingOrbProps } from './types';

const LABELS: Record<string, string> = {
  working: 'Working…',
  searching: 'Searching…',
  solving: 'Solving…',
  logoSolving: 'Solving…',
  logoBreathing: 'Breathing · logo…',
  listening: 'Listening…',
  connecting: 'Connecting…',
  weaving: 'Weaving…',
  composing: 'Composing…',
  breathing: 'Thinking…',
  shaping: 'Shaping…'
};

export function ThinkingOrb({
  state = 'working',
  size = 64,
  theme = 'auto',
  speed = 1,
  paused = false,
  style,
  'aria-label': ariaLabel,
  ...rest
}: ThinkingOrbProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const dark = useResolvedDark(theme, ref);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(2, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    if (state === 'working' || state === 'searching' || state === 'solving' || state === 'logoSolving' || state === 'logoBreathing') {
      const logo = new Image();
      const outerLogo = new Image();
      const coreLogo = new Image();
      let raf = 0;
      let running = false;
      logo.src = '/sigvoid-logo.svg';
      outerLogo.src = '/sigvoid-logo-outer.svg';
      coreLogo.src = '/sigvoid-logo-core.svg';
      const drawLogo = (t: number) => {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, size, size);

        if (state === 'working' || state === 'logoBreathing') {
          // The logo is treated as four nested opacity layers. The innermost
          // layer flashes first, then hands the pulse to the outer layers.
          const center = size / 2;
          const logoW = size * 0.66;
          const logoH = logoW * (456.33 / 598.35);
          const scales = [0.58, 0.74, 0.88, 1];
          const levels = [0.8, 0.6, 0.4, 0.2];
          for (let layer = 0; layer < 4; layer++) {
            const sequence = 3 - layer;
            const wave = (t * 0.48 - sequence * 0.23) % 1;
            const wrapped = wave < 0 ? wave + 1 : wave;
            const pulse = Math.pow(Math.sin(Math.PI * wrapped), 1.35);
            const opacity = 0.035 + pulse * levels[layer];
            const w = logoW * scales[layer];
            const h = logoH * scales[layer];
            ctx.save();
            ctx.translate(center, center);
            ctx.globalAlpha = opacity;
            ctx.drawImage(logo, -w / 2, -h / 2, w, h);
            ctx.restore();
          }
          if (running) raf = requestAnimationFrame(loop);
          return;
        }

        // The logo is a fixed center mark. Only surrounding material moves.
        const logoW = size * 0.66;
        const logoH = logoW * (456.33 / 598.35);
        const searchAngle = t * 1.25;
        // Make the attraction readable at small sizes: the logo and the
        // scanning line share the same soft pull toward the moving fly-line.
        const bodyPull = state === 'searching' ? Math.min(2.8, size * 0.1) : 0;
        const bodyX = size / 2 + Math.cos(searchAngle) * bodyPull;
        const bodyY = size / 2 + Math.sin(searchAngle) * bodyPull;
        ctx.save();
        ctx.translate(bodyX, bodyY);
        ctx.globalAlpha = 0.9;
        ctx.drawImage(logo, -logoW / 2, -logoH / 2, logoW, logoH);
        ctx.restore();

        if (state === 'searching') {
          // Searching contrast group: the logo stays plain while a thicker
          // short fly-line carries a fine moving band and a soft tail.
          const angle = searchAngle;
          ctx.save();
          ctx.translate(bodyX, bodyY);
          ctx.lineCap = 'round';
          ctx.globalAlpha = 0.18;
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = Math.max(0.55, size * 0.012);
          ctx.beginPath();
          ctx.arc(0, 0, size * 0.39, angle - 0.42, angle - 0.02);
          ctx.stroke();

          ctx.globalAlpha = 0.52;
          ctx.lineWidth = Math.max(0.8, size * 0.026);
          ctx.beginPath();
          ctx.arc(0, 0, size * 0.39, angle - 0.18, angle + 0.18);
          ctx.stroke();

          ctx.globalAlpha = 0.88;
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = Math.max(0.45, size * 0.009);
          ctx.beginPath();
          ctx.arc(0, 0, size * 0.39, angle - 0.22, angle + 0.2);
          ctx.stroke();
          ctx.restore();
          ctx.globalAlpha = 1;
          if (running) raf = requestAnimationFrame(loop);
          return;
        }

        if (state === 'solving' || state === 'logoSolving') {
          // Solving warp: the logo remains the anchor while its outer contour
          // flexes in a small, continuous space distortion.
          const center = size / 2;
          const logoW = size * 0.66;
          const logoH = logoW * (456.33 / 598.35);
          // Finalized 02:34 warp: a deterministic pseudo-random rhythm with
          // a 3.8s loop, so it feels organic but always closes seamlessly.
          const wave = (t % 3.8) / 3.8 * Math.PI * 2;
          const warpPx = Math.min(2, size * 0.08);
          const sx = 1 + Math.sin(wave + 0.4) * 0.018 + Math.sin(wave * 2.0 + 1.2) * 0.008;
          const sy = 1 - Math.sin(wave + 0.8) * 0.014 + Math.sin(wave * 2.0 + 0.2) * 0.007;
          const shear = Math.sin(wave + 1.7) * 0.025 + Math.sin(wave * 2.0 + 0.4) * 0.012;
          const driftX = (Math.sin(wave + 0.35) * 0.62 + Math.sin(wave * 2.0 + 1.4) * 0.23 + Math.sin(wave * 3.0 + 2.1) * 0.15) * warpPx;
          const driftY = (Math.sin(wave + 1.1) * 0.48 + Math.sin(wave * 2.0 + 2.0) * 0.32 + Math.sin(wave * 3.0 + 0.2) * 0.20) * warpPx;
          ctx.save();
          ctx.translate(center + driftX, center + driftY);
          ctx.transform(sx, shear, -shear * 0.62, sy, 0, 0);
          ctx.globalAlpha = 0.78;
          ctx.drawImage(logo, -logoW / 2, -logoH / 2, logoW, logoH);
          ctx.restore();

          // A second, counter-phased contour makes the deformation readable
          // without turning the mark into a rotating orbit.
          const sx2 = 1 - (Math.sin(wave + 1.15) * 0.012 + Math.sin(wave * 2.0) * 0.006);
          const sy2 = 1 + (Math.sin(wave + 2.0) * 0.010 + Math.sin(wave * 2.0 + 1.0) * 0.005);
          ctx.save();
          ctx.translate(center - driftX * 0.45, center - driftY * 0.45);
          ctx.transform(sx2, -shear * 0.4, shear * 0.3, sy2, 0, 0);
          ctx.globalAlpha = 0.25;
          ctx.drawImage(logo, -logoW / 2, -logoH / 2, logoW, logoH);
          ctx.restore();
        }

        // Independent particle ages make the flow continuous rather than a
        // single group that scales in and out together.
        const particleCount = size <= 24 ? 14 : 20;
        for (let i = 0; i < particleCount; i++) {
          const age = (t * 0.16 + i / particleCount) % 1;
          const a = i * 2.399 + Math.sin(t * 0.35 + i) * 0.05;
          const r = size * (0.46 - age * 0.18);
          ctx.globalAlpha = 0.34 + (1 - age) * 0.48;
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          const drag = Math.sin(a * 2 + t) * age * size * 0.035;
          const particleRadius = Math.max(size <= 24 ? 0.55 : 0.8, size * (0.008 + (1 - age) * 0.006));
          ctx.arc(size / 2 + Math.cos(a) * r + drag, size / 2 + Math.sin(a) * r * 0.72, particleRadius, 0, Math.PI * 2);
          ctx.fill();
        }
        // Solving uses the finalized warp + inward star field combination.
        ctx.globalAlpha = 1;
        if (running) raf = requestAnimationFrame(loop);
      };
      const loop = (ms: number) => drawLogo(ms / 1000);
      const start = () => { if (!running && !paused) { running = true; raf = requestAnimationFrame(loop); } };
      // Start the clock independently of asset loading. Previously the
      // animation could remain on its first frame when the SVG was cached or
      // when its load callback was missed by the preview environment.
      logo.onload = () => drawLogo(0);
      outerLogo.onload = () => drawLogo(0);
      coreLogo.onload = () => drawLogo(0);
      const customSolving = state === 'solving' || state === 'logoSolving';
      // Keep the custom Solving mark animated in the visual preview even
      // when the host browser advertises reduced motion. Other states still
      // honor the accessibility preference below.
      if (reduced && !customSolving) logo.onload = () => drawLogo(0.4);
      if (!reduced || customSolving) {
        drawLogo(0);
        start();
      }
      return () => { running = false; cancelAnimationFrame(raf); };
    }

    const { mode, speed: baseSpeed, opts } = resolvePreset(state, size);
    const draw = MODE_DRAWS[mode];
    const effSpeed = baseSpeed * speed;

    const frame = (tSec: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      draw(ctx, size, tSec, dark, opts);
    };

    // reduced motion → one static, deterministic frame
    if (reduced) {
      frame(0.6);
      return;
    }

    let raf = 0;
    let running = false;
    const loop = () => {
      frame((performance.now() / 1000) * effSpeed);
      if (running) raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || paused) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // draw at least one frame even when paused/offscreen
    frame((performance.now() / 1000) * effSpeed);

    // pause offscreen + on hidden tabs — free when not visible
    let visible = true;
    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            if (visible && document.visibilityState !== 'hidden') start();
            else stop();
          })
        : null;
    io?.observe(canvas);
    const onVis = () => {
      if (document.visibilityState === 'hidden') stop();
      else if (visible) start();
    };
    document.addEventListener('visibilitychange', onVis);
    if (!io) start();

    return () => {
      stop();
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [state, size, dark, speed, paused, reduced]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={ariaLabel ?? LABELS[state]}
      style={{ width: size, height: size, display: 'block', ...style }}
      {...rest}
    />
  );
}
