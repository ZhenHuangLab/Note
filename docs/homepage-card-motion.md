---
title: Homepage Card Motion QA
sidebar_position: 95
---

# Homepage Card Motion QA

This note captures the tuning targets, autoplay contract, and manual validation steps for the React homepage cards. Use it as a regression checklist when iterating on the motion stack or porting future choreography tweaks.

## Motion States & Springs

- **Pointer / touch**: `useSpringRaf` targets `rotate`, `glare`, `background`, `scale`, `translate`, and `rotateDelta` with interactive config `stiffness 0.066`, `damping 0.25`.
- **Orientation**: Engages after ~2° total tilt, releases after `20` quiet frames below `0.75` combined tilt. Uses softer `soft: 0.2` easing and mirrors TonyCrane glare centering.
- **Popover**: Reuses showcase-scale springs with `stiffness 0.033`, `damping 0.45` and a `soft` snap factor of `0.35` for hover release.
- **Inertial release**: Velocity carry-over multiplies rotate/glare/background velocities by `10 | 8` (reduced motion: `4 | 3`) before snapping back with `soft: 0.16` (reduced: `0.28`).

## Showcase Autoplay Contract

- Starts ~2 seconds after mount when `showcase` prop is true, the document is visible, reduced motion is **not** requested, and the card is idle.
- Runs a single 4 second sine-driven loop (`r = progress * 2π`) to animate rotate ±10°/6.5°, glare sweep ±45%, background parallax ±12%, scale to `1.02`, translate Y to `-3px` (reduced motion trims to 80% amplitude).
- Cancels immediately on pointer/touch/orientation interaction, visibility loss, or prop change; cleanup resets springs through `releaseToIdle(false)`.
- Applies `active` / `interacting` classes while autoplay is running so CSS glow and touch-action parity match the reference build.

## Reduced Motion Expectations

- When `prefers-reduced-motion: reduce` is active, showcase autoplay is skipped entirely and hover motion caps amplitudes (scale `1.015`, translate `-2px`, opacity `0.65`).
- Orientation limits contract to ±10°/12° and inertial multipliers drop to maintain low-amplitude return.
- Manual verification: enable reduced motion in macOS (`Settings → Accessibility → Display → Reduce motion`) or DevTools, reload, confirm no autoplay and muted hover responses.

## Manual QA Checklist

1. **Desktop hover cadence**: Hover the showcase card, release at multiple speeds. Expect two-stage inertial snap-back without abrupt jumps.
2. **Autoplay parity**: Reload, wait 2s, observe 4s showcase loop. Move pointer mid-loop—animation cancels immediately and card hands control to pointer.
3. **Orientation cancel**: In mobile simulator enable device tilt. After tilt >2°, orientation takes over; stop motion to ensure idle release after ~20 quiet frames.
4. **Visibility pause**: Start autoplay, switch browser tab—animation stops and card resets. Return within 10s; no autoplay resumes automatically (matches reference).
5. **Reduced motion**: With prefers-reduced-motion enabled, reload: no autoplay, hover uses low-amplitude targets, releasing still performs soft snap.

Document any deviations plus browser/device under test in `_TASKs/T3_card-physics-parity.md` during future iterations.
