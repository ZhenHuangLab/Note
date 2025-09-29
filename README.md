# Note Homepage

This repository hosts the Docusaurus-powered mirror of TonyCrane's note homepage, including a pixel-accurate React rewrite of the flagship Pokémon-style card experience.

## Prerequisites

- Node.js 20 or newer (see `package.json#engines`).
- npm 9+ (preferred). pnpm or yarn also work if you translate the commands yourself.

Install dependencies with:

```bash
npm install
```

## Local Development

```bash
npm run start
```

The dev server hot-reloads markdown content and the homepage card interactions. Device-orientation input, reduced-motion settings, and theme toggles are pulled live from your browser, so you can validate behaviour without restarts.

## Build & Preview

```bash
npm run build
npm run serve -- --port 3300
```

`npm run serve` launches the static preview at `http://localhost:3300`.

## Testing & QA

- **Manual checklist** (mirrors Phase P9):
  - Pointer or touch movement tilts, parallaxes, and snaps back identically to the Svelte reference.
  - `prefers-reduced-motion` lowers tilt amplitude, suppresses the showcase loop, and scales translate targets.
  - Switching tabs or minimising the window immediately pauses springs and fades the shine (`--card-opacity → 0`).
  - Device orientation (mobile browsers) engages only after gentle motion and releases after ~20 idle frames.
- **Debug overlay**: in non-production builds the card renders `CardHud`, exposing current CSS variable values.

## Homepage Cards (React)

- Core source: `src/components/Cards` (`Card.tsx`, `CardProxy.tsx`, `useSpringRaf.ts`, helpers).
- Assets & CSS: `static/css/cards` and `static/assets/cards` mirror the upstream `pokemon-cards-css` structure.
- Entry point: `src/pages/index.tsx` injects the CSS via `<Head>` and renders `<HomepageCard />` within the hero section.
- Behaviour highlights:
  - Pointer math now matches the original `adjust`/`round` curves (background ranges 37–63 / 33–67; rotation derives from the pointer centre).
  - The glare spring carries an `opacity` channel that fades out during idle or visibility pauses.
  - A global RAF scheduler pauses on `document.visibilityState === 'hidden'` and per-element via `IntersectionObserver`.
  - Showcase animation (2 s delay, 4 s sweep) only runs when the card is idle and reduced-motion is off.
  - Orientation input resets its baseline on engage and relinquishes control automatically when motion subsides.

## Rollback

To revert the React card integration:

1. Remove the `<HomepageCard />` import/render plus the two `<link rel="stylesheet">` entries from `src/pages/index.tsx`.
2. Delete `src/components/Cards` if no longer required.
3. Remove copied assets under `static/css/cards` and `static/assets/cards`.
4. Run `npm run build` (or preview) to confirm the bundle no longer references the card resources.

Reverting the feature branch commits is also safe; no persistent data or schema changes were introduced.

## Licensing Notes

- The Pokémon card visual treatment originates from [simeydotme/pokemon-cards-css](https://github.com/simeydotme/pokemon-cards-css) (GPL-3.0). The full license text is preserved at `LICENSES/pokemon-cards-css.LICENSE`.
- Behavioural parity parameters were derived from [TonyCrane/note-homepage-cards](https://github.com/TonyCrane/note-homepage-cards); only numerical tuning and CSS assets were ported.
- Ensure derivative work continues to ship the GPL notice when distributing the cards feature.
