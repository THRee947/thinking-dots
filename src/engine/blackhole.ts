import type { ModeDraw } from './types';

const smoothstep = (x: number) => x * x * (3 - 2 * x);

function lensPoint(a: number, radius: number, scale: number, t: number, ring: number): [number, number] {
  // Gravitational distortion: the horizontal sides are pulled toward the
  // event horizon, while the upper/lower light bends farther around it.
  const sidePull = 1 - 0.23 * Math.cos(a * 2);
  const turbulence = 1 + 0.055 * Math.sin(a * 3 + t * 1.4 + ring * 0.8);
  const x = Math.cos(a) * radius * sidePull * turbulence * scale;
  const y = Math.sin(a) * radius * (0.58 + 0.08 * Math.sin(a * 2 + ring)) * turbulence * scale;
  return [x, y];
}

function strokeLens(ctx: CanvasRenderingContext2D, radius: number, scale: number, t: number, ring: number, alpha: number, color: number[], width: number) {
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = `rgb(${color.join(',')})`;
  ctx.lineWidth = width * scale;
  ctx.beginPath();
  for (let i = 0; i <= 56; i++) {
    const a = i / 56 * Math.PI * 2;
    const [x, y] = lensPoint(a, radius, scale, t, ring);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawSharedLensOutline(ctx: CanvasRenderingContext2D, scale: number, color: number[]) {
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = `rgb(${color.join(',')})`;
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.2 * scale;
  ctx.beginPath();
  ctx.moveTo(-15 * scale, 0);
  ctx.bezierCurveTo(-11 * scale, 0, -9 * scale, -1.2 * scale, -7 * scale, -4.8 * scale);
  ctx.bezierCurveTo(-4 * scale, -7 * scale, 4 * scale, -7 * scale, 7 * scale, -4.8 * scale);
  ctx.bezierCurveTo(9 * scale, -1.2 * scale, 11 * scale, 0, 15 * scale, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-15 * scale, 0);
  ctx.bezierCurveTo(-11 * scale, 0, -9 * scale, 1.2 * scale, -7 * scale, 4.8 * scale);
  ctx.bezierCurveTo(-4 * scale, 7 * scale, 4 * scale, 7 * scale, 7 * scale, 4.8 * scale);
  ctx.bezierCurveTo(9 * scale, 1.2 * scale, 11 * scale, 0, 15 * scale, 0);
  ctx.stroke();
  ctx.lineWidth = 0.62 * scale;
  ctx.beginPath(); ctx.moveTo(-14 * scale, 0); ctx.lineTo(14 * scale, 0); ctx.stroke();
  ctx.lineWidth = 1.4 * scale;
  ctx.beginPath(); ctx.arc(0, 0, 12.4 * scale, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

/** A compact black-hole loader: event horizon, warped accretion disk, and orbiting dots. */
export const drawBlackHole: ModeDraw = (ctx, size, t, dark, opts) => {
  const c = size / 2;
  const scale = size / 64;
  const pulse = 1 + Math.sin(t * 1.7) * 0.035;
  const spin = t * 0.9;
  const ink = dark ? 1 : 0;
  // Monochrome product treatment: only black and white are used. Depth comes
  // from opacity and the dark event horizon, not from hue changes.
  const hot = dark ? [255, 255, 255] : [0, 0, 0];
  const warm = dark ? [255, 255, 255] : [0, 0, 0];
  const variant = Number(opts.variant ?? 0);

  ctx.save();
  ctx.translate(c, c);
  ctx.scale(1, 0.42);

  // Distinct motion models for the non-default states. They return before
  // the shared accretion-disk pass, so the states do not collapse into one
  // animation with different decorations.
  if (variant !== 0) {
    ctx.restore();
    ctx.save();
    ctx.translate(c, c);
    // Small sizes need a readable silhouette, so status variants face the
    // viewer instead of inheriting the very flat disk perspective.
    if (variant === 1) ctx.rotate(-0.12);
    const drawDot = (x: number, y: number, r: number, alpha = 0.7, color = hot) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgb(${color.join(',')})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };
    if (variant === 1) {
      // Searching: loose particles continuously fall into the center. There
      // is no orbit, so the motion reads as absorption rather than a web.
      for (let i = 0; i < 24; i++) {
        const phase = (t * 0.62 + i / 24) % 1;
        const a = i * 2.399 + Math.sin(i) * 0.4;
        const r = (26 - phase * 19) * scale;
        const wobble = Math.sin(t * 2 + i) * phase * 1.8 * scale;
        drawDot(Math.cos(a) * r + wobble, Math.sin(a) * r * 0.78, 0.55 * scale + phase * 0.45 * scale, 0.18 + (1 - phase) * 0.7, hot);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(0, 0, 11.5 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = `rgb(${hot.join(',')})`;
      ctx.lineWidth = 1 * scale;
      ctx.beginPath(); ctx.arc(0, 0, 19 * scale, t * 1.8, t * 1.8 + 0.34); ctx.stroke();
    } else if (variant === 2 || variant === 9) {
      // Solving v2: continuous absorption only. Each particle has an
      // independent age, so new material enters as old material disappears
      // into the horizon; there is no collapse/explosion beat to interrupt it.
      for (let i = 0; i < 22; i++) {
        const age = (t * 0.34 + i / 22) % 1;
        const a = i * 2.399 + t * 0.18;
        const startR = (24 + (i % 3) * 4) * scale;
        const r = startR - age * (startR - 7 * scale);
        const yScale = 0.34 + (i % 2) * 0.06;
        const alpha = 0.16 + (1 - age) * 0.7;
        drawDot(Math.cos(a) * r, Math.sin(a) * r * yScale, (0.55 + (1 - age) * 0.45) * scale, alpha, hot);
      }
      ctx.save();
      ctx.rotate(-0.38 + t * 0.25);
      for (let streak = 0; streak < 8; streak++) {
        const age = (t * 0.22 + streak * 0.13) % 1;
        const a = streak * 0.82 + t * 1.7;
        const r = (23 - age * 15) * scale;
        ctx.globalAlpha = 0.12 + (1 - age) * 0.32;
        ctx.strokeStyle = `rgb(${hot.join(',')})`;
        ctx.lineWidth = (0.55 + (streak % 2) * 0.25) * scale;
        ctx.beginPath();
        for (let step = 0; step <= 10; step++) {
          const p = a + step * 0.06;
          const rr = r - step * 0.18 * scale;
          const x = Math.cos(p) * rr;
          const y = Math.sin(p) * rr * 0.42;
          step === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
      // The event horizon sits behind the incoming particles and lens light.
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(0, 0, 11.5 * scale, 0, Math.PI * 2); ctx.fill();

      // Gravitational-lens silhouette: a narrow horizontal light line with
      // compressed wings on both sides, rather than a plain black circle.
      if (variant === 2) ctx.save();
      if (variant === 2) {
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = `rgb(${hot.join(',')})`;
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.35 * scale;
      // Keep the diagnostic version intentionally simple: the circular
      // horizon and short center beam should read before any lens contour.
      ctx.globalAlpha = 0;
      ctx.beginPath();
      ctx.moveTo(-15 * scale, 0);
      ctx.bezierCurveTo(-12 * scale, 0, -10 * scale, -0.2 * scale, -8 * scale, -1.8 * scale);
      ctx.bezierCurveTo(-7 * scale, -4.8 * scale, -4.8 * scale, -6 * scale, 0, -6 * scale);
      ctx.bezierCurveTo(4.8 * scale, -6 * scale, 7 * scale, -4.8 * scale, 8 * scale, -1.8 * scale);
      ctx.bezierCurveTo(10 * scale, -0.2 * scale, 12 * scale, 0, 15 * scale, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-15 * scale, 0);
      ctx.bezierCurveTo(-12 * scale, 0, -10 * scale, 0.2 * scale, -8 * scale, 1.8 * scale);
      ctx.bezierCurveTo(-7 * scale, 4.8 * scale, -4.8 * scale, 6 * scale, 0, 6 * scale);
      ctx.bezierCurveTo(4.8 * scale, 6 * scale, 7 * scale, 4.8 * scale, 8 * scale, 1.8 * scale);
      ctx.bezierCurveTo(10 * scale, 0.2 * scale, 12 * scale, 0, 15 * scale, 0);
      ctx.stroke();
      ctx.globalAlpha = 0.95;
      ctx.lineWidth = 0.62 * scale;
      ctx.beginPath();
      ctx.moveTo(-14 * scale, 0);
      ctx.lineTo(14 * scale, 0);
      ctx.stroke();
      // Reassert the circular event-horizon silhouette above the lens wings.
      // The circle is the primary mark; the horizontal lens is secondary.
      ctx.globalAlpha = 0.95;
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, 12.4 * scale, 0, Math.PI * 2);
      ctx.stroke();
      }
      if (variant === 2) ctx.restore();
      if (variant === 2) {
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = `rgb(${hot.join(',')})`;
        ctx.lineWidth = 1 * scale;
        ctx.beginPath(); ctx.arc(0, 0, 12.5 * scale, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      return;

      // Solving: stars are absorbed from the outside, the hole collapses,
      // then a new hole explodes outward. One full cycle repeats forever.
      const cycle = (t * 0.22) % 1;
      // Give the absorption phase most of the time; the collapse is a short,
      // decisive beat so the semantic emphasis lands on “solved”.
      const absorb = Math.min(1, cycle / 0.68);
      const collapse = Math.max(0, Math.min(1, (cycle - 0.68) / 0.08));
      const explode = Math.max(0, Math.min(1, (cycle - 0.76) / 0.24));
      const easeIn = smoothstep(absorb);
      const easeCollapse = smoothstep(collapse);
      const easeOut = smoothstep(explode);
      const holeRadius = cycle < 0.68 ? 6.5 : cycle < 0.76 ? 6.5 * (1 - easeCollapse) : 6.5 * easeOut;

      // Incoming material approaches from depth, without a persistent orbit.
      ctx.save();
      ctx.rotate(-0.38);
      // Stars travel along the disk toward the horizon.
      for (let i = 0; i < 18; i++) {
        const a = i / 18 * Math.PI * 2 + t * 0.75;
        const startR = 26 + (i % 3) * 4;
        // Closed radial path: every particle ends exactly where its next
        // cycle begins, so the loop has no visible jump at the seam.
        const r = cycle < 0.68
          ? startR - (startR - 8) * easeIn
          : cycle < 0.76
            ? 8
            : 8 + (startR - 8) * easeOut;
        const yScale = 0.34 + (i % 2) * 0.05;
        const alpha = cycle < 0.68
          ? 0.9 - easeIn * 0.68
          : cycle < 0.76
            ? 0.22 - easeCollapse * 0.1
            : 0.12 + easeOut * 0.78;
        drawDot(Math.cos(a) * r * scale, Math.sin(a) * r * yScale * scale, 0.65 * scale + (explode > 0 ? explode * 0.35 * scale : 0), alpha, hot);
      }

      // After most of the star field has been absorbed, the remaining light
      // is dragged around the horizon in short clockwise streaks. These are
      // intentionally broken arcs, not closed orbit lines.
      if (cycle < 0.76) {
        const lightFade = cycle < 0.68 ? 0.82 : 0.82 * (1 - smoothstep((cycle - 0.68) / 0.08));
        ctx.save();
        ctx.rotate(-0.38 + t * 0.3);
        for (let streak = 0; streak < 7; streak++) {
          // Each streak has its own life: new light appears at the outside
          // while older light is already falling toward the horizon.
          const streakAge = (t * 0.34 + streak * 0.17) % 1;
          const base = streak * 0.86 + t * 2.4;
          const radius = (25 - streakAge * 16) * scale;
          ctx.globalAlpha = lightFade * (0.18 + (1 - streakAge) * 0.38);
          ctx.strokeStyle = `rgb(${hot.join(',')})`;
          ctx.lineWidth = (0.55 + (streak % 2) * 0.3) * scale;
          ctx.beginPath();
          for (let step = 0; step <= 12; step++) {
            const a = base + step * 0.055;
            const rr = radius - step * 0.16 * scale;
            const x = Math.cos(a) * rr;
            const y = Math.sin(a) * rr * 0.42;
            step === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();


      // The black center is always legible, with a brief white shell at the
      // collapse / rebirth transition.
      // During collapse the singularity and its rim both disappear entirely;
      // the next visible object is the reborn hole during explosion.
      if (cycle < 0.68 || explode > 0) {
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(0, 0, holeRadius * scale, 0, Math.PI * 2); ctx.fill();
      }
      if (explode > 0) {
        const ringFade = 1 - smoothstep(explode);
        ctx.globalAlpha = ringFade * 0.95;
        ctx.strokeStyle = `rgb(${hot.join(',')})`;
        ctx.lineWidth = 1.3 * scale;
        ctx.beginPath(); ctx.arc(0, 0, (holeRadius + 3 * (collapse > 0 ? collapse : explode)) * scale, 0, Math.PI * 2); ctx.stroke();
      }
    } else if (variant === 7) {
      // Thinking / breathing: restore the original breathing waveform.
      ctx.strokeStyle = `rgb(${warm.join(',')})`; ctx.lineWidth = 1 * scale; ctx.globalAlpha = 0.75;
      ctx.beginPath();
      for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2; const rr = (14 + Math.sin(a * 7 - t * 3) * 2.5 + Math.sin(t * 1.2) * 2) * scale; const x = Math.cos(a) * rr; const y = Math.sin(a) * rr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.closePath(); ctx.stroke();
      drawDot(0, 0, 11.5 * scale, 1, dark ? [0, 0, 0] : [255, 255, 255]);
    } else if (variant === 3) {
      // Listening: a radial waveform changes depth and scale.
      ctx.strokeStyle = `rgb(${warm.join(',')})`; ctx.lineWidth = 1 * scale; ctx.globalAlpha = 0.75;
      ctx.beginPath();
      for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2; const rr = (14 + Math.sin(a * 7 - t * 3) * 2.5 + Math.sin(t * 1.2) * 2) * scale; const x = Math.cos(a) * rr; const y = Math.sin(a) * rr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.closePath(); ctx.stroke();
      drawDot(0, 0, 11.5 * scale, 1, dark ? [0, 0, 0] : [255, 255, 255]);
    } else if (variant === 4) {
      // Connecting: three rotating layers orbit and align around the hole.
      // This preserves the earlier solving motion, but gives it to the
      // connecting state without constellation nodes or network lines.
      const breathe = 1 - ((Math.sin(t * 2.4) + 1) / 2) * 0.18;
      for (let layer = 0; layer < 3; layer++) {
        const rr = (8 + layer * 6) * scale * breathe;
        ctx.save();
        ctx.rotate(t * (layer % 2 ? -1.3 : 1.1) + layer);
        ctx.globalAlpha = 0.5 + layer * 0.12;
        ctx.strokeStyle = `rgb(${(layer === 1 ? warm : hot).join(',')})`;
        ctx.lineWidth = 1 * scale;
        ctx.beginPath(); ctx.arc(0, 0, rr, 0.2, Math.PI * 1.7); ctx.stroke();
        for (let i = 0; i < 6; i++) {
          const a = i * Math.PI / 3 + t * (layer + 1) * 0.4;
          drawDot(Math.cos(a) * rr, Math.sin(a) * rr, 0.8 * scale, 0.65, layer === 2 ? warm : hot);
        }
        ctx.restore();
      }
      drawDot(0, 0, 11.5 * scale, 1, dark ? [0, 0, 0] : [255, 255, 255]);
    } else {
      // Weaving / composing / shaping: interlaced elliptical strands.
      for (let strand = 0; strand < 3; strand++) { ctx.strokeStyle = `rgb(${(strand === 1 ? warm : hot).join(',')})`; ctx.lineWidth = (strand === 1 ? 1.4 : 0.8) * scale; ctx.globalAlpha = 0.6; ctx.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; const rr = (13 + strand * 4 + Math.sin(a * 2 + t * (strand + 1)) * 2) * scale; const x = Math.cos(a + t * (strand % 2 ? -0.7 : 0.7)) * rr; const y = Math.sin(a) * rr * 0.55; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
      drawDot(0, 0, 9 * scale, 1, dark ? [0, 0, 0] : [255, 255, 255]);
    }
    if (variant === 0) {
      drawSharedLensOutline(ctx, scale, hot);
    }
    ctx.restore();
    return;
  }

  // Thin outer gravitational halo.
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = `rgb(${warm.join(',')})`;
  ctx.lineWidth = 1.1 * scale;
  ctx.beginPath();
  ctx.arc(0, 0, 24 * scale * pulse, 0, Math.PI * 2);
  ctx.stroke();

  // Dotted accretion disk. The phase offset makes each dot travel around the hole.
  for (let ring = 0; ring < 4; ring++) {
    const radius = (13 + ring * 4) * scale;
    const count = Math.max(10, Math.round((18 - ring) * scale));
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + spin * (1 + ring * 0.12) + ring * 0.7;
      const [x, y] = lensPoint(a, radius, 1, t, ring);
      // Light concentrates on the bent upper/lower arcs, not uniformly around
      // the circumference like a planet ring.
      const alpha = 0.16 + 0.42 * Math.pow(Math.abs(Math.sin(a)), 1.5);
      ctx.globalAlpha = alpha;
      const ringColor = ring === 0 ? (dark ? [0, 0, 0] : [255, 255, 255]) : ring === 1 ? hot : warm;
      ctx.fillStyle = `rgb(${ringColor.join(',')})`;
      ctx.beginPath();
      ctx.arc(x, y, (ring === 0 ? 1.1 : 0.72) * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Dark event horizon with a bright, slightly breathing rim.
  ctx.globalAlpha = 1;
  ctx.fillStyle = dark ? '#050811' : '#f7f8fc';
  ctx.beginPath();
  ctx.arc(0, 0, 8.2 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = `rgb(${hot.join(',')})`;
  ctx.lineWidth = 1.2 * scale;
  ctx.beginPath();
  ctx.arc(0, 0, 9.5 * scale * pulse, 0, Math.PI * 2);
  ctx.stroke();

  // A few particles fall inward, communicating “thinking” rather than a static icon.
  for (let i = 0; i < 8; i++) {
    const phase = (t * 0.35 + i / 8) % 1;
    const a = i * 2.4 + t * 0.22;
    const radius = (30 - phase * 18) * scale;
    ctx.globalAlpha = 0.18 + phase * 0.45;
    ctx.fillStyle = `rgb(${hot.join(',')})`;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * radius, Math.sin(a) * radius * 0.7, 0.75 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  drawSharedLensOutline(ctx, scale, hot);
  ctx.restore();

};
