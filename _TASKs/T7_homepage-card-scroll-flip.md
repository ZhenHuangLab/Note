# TASK: Homepage Card Scroll-Driven Flip Animation with Progress Indicator (v2)

## 0) META

**Task ID:** T7
**Title:** Homepage Card Scroll-Driven Flip Animation with Progress Indicator
**Repo Root:** `/Users/zhenhuang/Documents/Note`
**Branch:** `feature/T7-card-scroll-flip`
**Status:** planning (v2 - ARCHITECTURE CORRECTED)
**Version:** 2.0 (redesigned after controller architecture analysis)
**Goal:** Implement scroll-driven card flip animation that rotates the homepage card from front to back as user scrolls, with an animated progress indicator that appears during scroll and auto-hides afterward, working seamlessly on both desktop and mobile, **properly integrated with the existing controller state machine**.

**Non-Goals:**
- Hijacking native scroll behavior (we supplement, not replace)
- Breaking existing card physics/hover/orientation effects
- Complex gesture controls beyond standard scroll
- Modifying CardProxy or Card component internals beyond necessary integration points

**Dependencies:**
- Existing card system (Card.tsx, CardProxy.tsx, HomepageCard.tsx, base.css, cards.css)
- Existing controller state machine: `controllerRef<'idle' | 'pointer' | 'orientation' | 'showcase'>`
- Existing spring system: `rotateSpring`, `rotateDeltaSpring`, `glareSpring`, `backgroundSpring`, `scaleSpring`, `translateSpring`
- React hooks for scroll tracking
- CSS custom properties for animation

**Constraints:**
- **Architecture:** MUST integrate with existing controller state machine (Card.tsx:91)
- **Transform Layer:** MUST use `.card__rotator` for 3D transforms, NOT parent containers
- **Spring System:** MUST use existing spring controllers, NOT create parallel animation systems
- **Performance:** Must maintain 60fps on scroll (use CSS transforms, not JS animations)
- **Accessibility:** Must not break keyboard navigation or screen readers
- **Compatibility:** Preserve ALL existing card hover/glare/orientation effects
- **Responsiveness:** Must work on mobile (320px) through desktop (2560px+)

**Acceptance Criteria:**
1. **AC1:** Scrolling down rotates card from front (0°) to back (180°) smoothly via `rotateDeltaSpring`
2. **AC2:** Scrolling up rotates card back to front smoothly
3. **AC3:** Card back face has material effects matching front (shine, glare, edge glow)
4. **AC4:** Progress indicator appears on right side during scroll, auto-hides 1s after scroll stops
5. **AC5:** Works on desktop (mouse scroll) and mobile (touch scroll)
6. **AC6:** Existing card hover effects remain functional and properly blend with scroll rotation
7. **AC7:** Controller state machine properly handles scroll + pointer/orientation conflicts
8. **AC8:** Verified via Playwright automated tests

**Test Strategy:**
- **Unit:** Hook tests for scroll progress calculation
- **Integration:** Component tests for card rotation, progress bar visibility, controller state transitions
- **E2E:** Playwright tests for full user flow (scroll → flip → progress bar → hover → state conflicts)
- **Visual:** Manual verification of material effects on back face
- **Performance:** Chrome DevTools FPS monitoring during scroll
- **Controller:** Test state transitions: scroll vs pointer, scroll vs orientation, scroll vs showcase

**Rollback:**
```bash
git checkout master
git branch -D feature/T7-card-scroll-flip
```
Clean rollback as all changes are additive and isolated.

**Owner:** @user

---

## 1) CONTEXT

### Current Behavior
- Homepage displays a single 3D interactive card (HomepageCard component)
- Card has **exclusive controller state machine** managing 4 states: `idle | pointer | orientation | showcase`
  - **pointer:** User hovering/touching (highest priority)
  - **orientation:** Device tilt via gyroscope
  - **showcase:** Auto-animation on page load (4s circular motion)
  - **idle:** No interaction, springs at rest
- Card uses **6 spring controllers** that update CSS variables:
  - `rotateSpring` → `--rotate-x`, `--rotate-y` (primary rotation)
  - `rotateDeltaSpring` → `--rotate-delta-x`, `--rotate-delta-y` (additional rotation offset)
  - `glareSpring` → `--glare-x`, `--glare-y`, `--card-opacity`
  - `backgroundSpring` → `--background-x`, `--background-y`
  - `scaleSpring` → `--card-scale`
  - `translateSpring` → `--translate-x`, `--translate-y`
- 3D rotation happens at `.card__rotator` layer (NOT parent containers)
- Card is static in scroll context (no scroll-driven animations)
- Standard browser scrollbar visible
- Only front face of card is displayed (back face exists in CSS but unused)

### Architecture Discovery (Critical)
**From Code Analysis (Card.tsx):**
- Line 91: `controllerRef = useRef<'idle' | 'pointer' | 'orientation' | 'showcase'>('idle')`
- Line 247: Pointer interaction immediately sets `controllerRef.current = 'pointer'`
- Line 437: Orientation checks and defers to pointer/showcase if active
- Line 583-587: Showcase waits for idle state before starting animation
- Line 144-147: `.card__rotator` receives final transform: `rotateY(calc(var(--rotate-x) + var(--rotate-delta-x))) rotateX(calc(var(--rotate-y) + var(--rotate-delta-y)))`

**Priority Order (Observed):**
```
pointer > showcase > orientation > idle
```

**Critical Finding:**
- **Scroll controller does NOT exist** in current architecture
- Must be added to state machine to prevent control conflicts
- Must use `rotateDeltaSpring` for scroll rotation to compose correctly with hover rotation on `rotateSpring`

### Target Behavior
- Page scroll drives card rotation: scroll progress 0-100% maps to Y-axis rotation 0-180° via `rotateDeltaSpring`
- Scroll controller integrates into state machine with priority: `pointer > showcase > scroll > orientation > idle`
- Card naturally flips to reveal back face as user scrolls down
- Card flips back to front as user scrolls up
- Hover effects blend smoothly with scroll rotation (blend factor prevents coordinate space issues at 90°)
- Animated progress indicator appears on right side during scroll, fades out 1s after scroll stops
- Back face displays relevant content with same material quality as front
- All existing pointer/orientation/showcase behaviors preserved and functional
- Works smoothly on mobile touch scroll and desktop mouse scroll

### Interfaces Touched
- **Modified Components:** `src/components/Cards/Card.tsx` (controller state machine integration)
- **Modified UI:** `src/pages/index.tsx` (add scroll tracking)
- **New Components:** `src/hooks/useScrollProgress.ts`, `src/components/ScrollProgressBar.tsx`, `src/components/Cards/CardBack.tsx`
- **Modified Styles:** `src/pages/index.module.css`
- **New Styles:** `src/components/ScrollProgressBar.module.css`, `src/components/Cards/CardBack.module.css`
- **Tests:** New Playwright test suite for scroll interactions and controller states

### Risk Notes
- **Architecture Risk (CRITICAL):** Transform composition conflicts if not using correct layer → **Mitigated:** Use `rotateDeltaSpring`, not parent transforms
- **State Collision (HIGH):** Scroll + pointer control conflicts → **Mitigated:** Explicit controller priority, pointer always wins
- **Transform Math (MEDIUM):** At 90° scroll, hover rotations in wrong coordinate space → **Mitigated:** Blend factor fades hover influence
- **Edge Case:** Rapid scroll direction changes must not cause jank → **Mitigated:** Spring system handles smoothing
- **Performance:** Mobile devices with weaker GPUs must maintain smooth animation → **Mitigated:** Passive listeners, GPU-accelerated transforms
- **Accessibility:** Screen readers must still announce card content correctly → **Mitigated:** Preserve semantic HTML structure
- **Browser Compat:** CSS 3D transforms must work in Safari, Firefox, Chrome → **Mitigated:** Use vendor prefixes from existing base.css
- **Content:** Back face content must be meaningful, not just decorative → **Design:** Show aggregated topic overview

---

## 2) HIGH-LEVEL PLAN

**Linus's Three Questions:**
1. ✅ **Is this a real problem?** YES - Homepage engagement is critical, scroll-driven storytelling is proven UX pattern
2. ✅ **Is there a simpler way?** YES - Integrate with existing spring system via `rotateDeltaSpring`, let controller state machine handle conflicts
3. ✅ **Will it break anything?** NO - Changes integrate with existing architecture, all current behaviors preserved

**Design Philosophy Applied:**
- **Good Taste:** Single state variable (`scrollProgress`), integrated into existing state machine. No special cases.
- **Simplicity:** Reuse existing spring system. Don't create parallel animation infrastructure.
- **Pragmatism:** Solve the actual problem (engagement) without fighting existing architecture
- **Zero Destructiveness:** All existing card physics preserved, changes integrate cleanly

### Phases

**P0: Controller State Machine Integration** (NEW - CRITICAL)
- Add `'scroll'` to controller state union type
- Define state transition rules and priority order
- Document controller architecture for future developers
- Test state conflict scenarios

**P1: Scroll Progress Hook & Spring Integration** (REDESIGNED)
- Create scroll tracking hook
- Integrate with `rotateDeltaSpring` (NOT parent transform)
- Handle controller state properly (defer to pointer)
- Add scroll controller activation/release logic

**P2: Transform Composition Blend Factor** (NEW - CRITICAL)
- Add blend calculation that fades hover influence as scroll increases
- Prevent coordinate space conflicts at 90° rotation
- Test at 0°, 45°, 90°, 135°, 180° scroll positions

**P3: Card Back Face Implementation**
- Design back face content
- Create CardBack component with material effects
- Integrate with existing card system

**P4: Animated Progress Indicator**
- Create progress bar component
- Implement auto-show/hide logic
- Style with glassmorphism effect

**P5: Mobile & Desktop Responsiveness**
- Add mobile CSS optimizations
- Test touch scroll performance
- Verify layout on all viewport sizes

**P6: Playwright E2E Verification**
- Write automated scroll tests
- Verify card flip behavior
- Test progress bar visibility
- Test controller state conflicts
- Validate no regression on existing features

---

## 3) PHASES

---

### Phase P0 — Controller State Machine Integration

#### 3.1 Plan

**Intent:** Integrate scroll controller into the existing exclusive state machine to prevent control conflicts and ensure proper priority ordering. This is the architectural foundation for all subsequent phases.

**Edits:**
1. **File:** `src/components/Cards/Card.tsx`
   - **Operation:** modify (Line 91 + new hooks/handlers)
   - **Rationale:** Add scroll to controller state machine, define priority order
   - **Method:**
     - **Line 91:** Change type from `'idle' | 'pointer' | 'orientation' | 'showcase'` to `'idle' | 'pointer' | 'scroll' | 'orientation' | 'showcase'`
     - Add `scrollControllerEnabledRef` to control whether scroll can take control
     - Add comment documenting priority: `pointer > showcase > scroll > orientation > idle`
     - **Do NOT modify existing controller logic** for pointer/orientation/showcase
   - **Lines Affected:** ~91, ~247, ~437, ~583
   - **Risk:** Breaking existing state transitions → **Mitigation:** Only add 'scroll', don't modify existing handlers

2. **File:** `src/components/Cards/Card.tsx` (documentation)
   - **Operation:** add inline comments
   - **Rationale:** Document controller state machine for future developers
   - **Method:**
     - Add block comment at Line ~91 explaining state machine architecture
     - Document priority order
     - Document transition rules
   - **Example:**
     ```tsx
     // Controller State Machine
     // Priority: pointer > showcase > scroll > orientation > idle
     // Transitions:
     //   - pointer: Always wins, immediately takes control
     //   - showcase: Waits for idle state
     //   - scroll: Defers to pointer/showcase, takes priority over orientation
     //   - orientation: Lowest priority, defers to all others
     const controllerRef = useRef<'idle' | 'pointer' | 'scroll' | 'orientation' | 'showcase'>('idle');
     ```

**Commands:**
```bash
npm run typecheck
```

**Tests Expected:**
- **Test:** TypeScript compilation with new state type
  - **Expectation:** No type errors, 'scroll' accepted as valid state
- **Test:** Existing pointer/orientation/showcase interactions still work
  - **Expectation:** No behavioral regressions

**Links:**
- TypeScript union types: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types
- State machine patterns: https://kentcdodds.com/blog/implementing-a-simple-state-machine-library-in-javascript

**Exit Criteria:**
- ✅ Controller type includes 'scroll' state
- ✅ Documentation added explaining state machine
- ✅ TypeScript compiles without errors
- ✅ No changes to existing controller behavior (pointer/orientation/showcase)
- ✅ Unit test verifies scroll state is valid type

---

#### 3.2 Execution
*(To be filled after implementation)*

**Status:** pending
**Files changed:** *(to be listed)*
**Notes:** *(decisions, deviations from plan)*

---

#### 3.3 Diffs
*(To be filled with unified diffs after implementation)*

---

#### 3.4 Inline Comments Added in Code
*(Document any non-obvious implementation details)*

---

#### 3.5 Results
*(To be filled after testing)*

**Build:** pending
**Lint:** pending
**Tests:** pending
**Meets Exit Criteria:** pending

---

#### 3.6 Review
*(To be filled by reviewer - Gemini or Codex)*

---

### Phase P1 — Scroll Progress Hook & Spring Integration

#### 3.1 Plan

**Intent:** Create scroll tracking hook that integrates cleanly with the existing spring system by updating `rotateDeltaSpring`, respecting controller priority, and deferring to pointer interactions.

**Architecture Decision:**
- ❌ **WRONG (v1 approach):** Apply transform to `.cardContainer` parent
  - **Why wrong:** Breaks glare/shine calculations, conflicts with `.card__rotator` 3D space
- ✅ **CORRECT (v2 approach):** Update `rotateDeltaSpring` which drives `--rotate-delta-y` CSS variable
  - **Why correct:** Composes cleanly with `rotateSpring` (hover), uses existing infrastructure

**Edits:**
1. **File:** `src/hooks/useScrollProgress.ts` (new)
   - **Operation:** add
   - **Rationale:** Encapsulate scroll tracking logic in reusable hook
   - **Method:**
     - Listen to window scroll events (passive listener for performance)
     - Calculate scroll progress: `(scrollY / (documentHeight - windowHeight)) * 100`
     - Use `requestAnimationFrame` throttling to batch updates (60fps)
     - Return `scrollProgress` (0-100) and `scrollRotation` (0-180)
     - Cleanup listener on unmount
   - **Signature:**
     ```tsx
     export const useScrollProgress = (): {
       scrollProgress: number;  // 0-100
       scrollRotation: number;  // 0-180 (for Y-axis rotation)
     } => { ... }
     ```

2. **File:** `src/components/Cards/Card.tsx`
   - **Operation:** modify
   - **Rationale:** Integrate scroll into spring system and controller state machine
   - **Method:**
     - Import `useScrollProgress` hook
     - Call hook to get `scrollRotation`
     - Add `useEffect` that monitors `scrollRotation` changes
     - Inside effect:
       - Check `controllerRef.current` - if `'pointer'` or `'showcase'`, skip (defer to higher priority)
       - If allowed, set `controllerRef.current = 'scroll'`
       - Update `rotateDeltaSpring.setTarget({ x: 0, y: scrollRotation })` with soft spring for smoothness
       - Add debounced release back to `'idle'` (200ms after scroll stops)
     - **Lines to modify:** Add effect after existing spring initialization (~line 500)
     - **Risk:** Breaking existing showcase effect → **Mitigation:** Only take control if not pointer/showcase

3. **File:** `src/pages/index.tsx`
   - **Operation:** modify (optional, if we need global scroll progress for progress bar)
   - **Rationale:** May need to lift scroll progress state if progress bar needs it
   - **Method:**
     - If CardProxy is refactored to accept scroll prop, add useScrollProgress here
     - Otherwise, keep scroll tracking inside Card.tsx

**Commands:**
```bash
npm run typecheck
npm run build
npm run start  # Manual testing
```

**Tests Expected:**
- **Test:** Open homepage, scroll down, verify card rotates on Y-axis
  - **Expectation:** Card rotation increases smoothly from 0° to 180° as scroll progresses
- **Test:** Hover card while scrolling
  - **Expectation:** Pointer takes priority, scroll rotation pauses
- **Test:** Release hover, continue scrolling
  - **Expectation:** Scroll controller resumes, rotation continues
- **Test:** Console log `controllerRef.current` during interactions
  - **Expectation:** State transitions: idle → scroll → pointer → scroll → idle

**Links:**
- React hooks best practices: https://react.dev/reference/react/hooks
- Passive event listeners: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#passive
- RequestAnimationFrame throttling: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame

**Exit Criteria:**
- ✅ useScrollProgress hook exists and returns scrollProgress, scrollRotation
- ✅ Scroll events update `rotateDeltaSpring` (NOT parent transform)
- ✅ Card visibly rotates on Y-axis when scrolling (manual test)
- ✅ Scroll controller defers to pointer (hover takes priority)
- ✅ Controller state transitions correctly: idle ↔ scroll ↔ pointer
- ✅ No TypeScript errors
- ✅ Build succeeds

---

#### 3.2 Execution
*(To be filled after implementation)*

**Status:** pending
**Files changed:** *(to be listed)*
**Notes:** *(decisions, deviations from plan)*

---

#### 3.3 Diffs
*(To be filled with unified diffs after implementation)*

---

#### 3.4 Inline Comments Added in Code
```tsx
// Reason: Use rotateDeltaSpring for scroll to compose with rotateSpring (hover)
// This prevents transform layer conflicts and coordinate space issues
rotateDeltaSpring.setTarget({ x: 0, y: scrollRotation }, { soft: 0.25 });
```

---

#### 3.5 Results
*(To be filled after testing)*

**Build:** pending
**Lint:** pending
**Tests:** pending
**Meets Exit Criteria:** pending

---

#### 3.6 Review
*(To be filled by reviewer - Gemini or Codex)*

---

### Phase P2 — Transform Composition Blend Factor

#### 3.1 Plan

**Intent:** Prevent coordinate space issues when hover rotation and scroll rotation compose at 90° by adding a blend factor that fades hover influence as scroll rotation increases.

**Problem:** At 90° scroll rotation (card edge-on), the card's coordinate system is tilted. Hover left/right (intended as X-axis rotation in viewport space) becomes front/back rotation (Z-axis in card's tilted space), causing incorrect hover behavior.

**Solution:** Add cosine blend factor that smoothly fades hover influence from 100% at 0° to 0% at 90°.

**Edits:**
1. **File:** `src/components/Cards/Card.tsx`
   - **Operation:** modify
   - **Rationale:** Add blend factor to hover rotation calculation
   - **Method:**
     - In `updateFromPointer` function (~line 242):
       - Calculate blend factor: `const hoverBlend = Math.cos((scrollRotation * Math.PI) / 180)`
         - At 0° scroll: `cos(0) = 1` (full hover influence)
         - At 45° scroll: `cos(45°) = 0.707` (70% hover influence)
         - At 90° scroll: `cos(90°) = 0` (no hover influence)
         - At 180° scroll: `cos(180°) = -1` (inverted, but we can clamp to 0-1)
       - Apply blend to rotation target:
         ```tsx
         const rotateTarget = {
           x: round(-(centerX / 3.5) * motionIntensity * hoverBlend),
           y: round((centerY / 2) * motionIntensity * hoverBlend),
         };
         ```
     - Need to pass `scrollRotation` from scroll hook to `updateFromPointer`
     - **Lines to modify:** ~242-265 (updateFromPointer function)

2. **File:** `src/hooks/useScrollProgress.ts`
   - **Operation:** modify
   - **Rationale:** Expose scrollRotation for blend calculation
   - **Method:**
     - Ensure scrollRotation is exported and accessible to Card.tsx
     - Consider adding `hoverBlend` calculation to hook for reusability

**Commands:**
```bash
npm run typecheck
npm run build
npm run start  # Manual testing at 0°, 45°, 90° scroll positions
```

**Tests Expected:**
- **Test:** Scroll to 0°, hover card
  - **Expectation:** Full hover tilt effect (as before)
- **Test:** Scroll to 45°, hover card
  - **Expectation:** Reduced hover tilt (~70% of normal)
- **Test:** Scroll to 90°, hover card
  - **Expectation:** Minimal/no hover tilt (card edge-on, blend ≈ 0)
- **Test:** Scroll to 180°, hover card
  - **Expectation:** Card fully flipped, blend factor at minimum

**Links:**
- 3D transform composition: https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/rotate3d
- Cosine blend curves: https://easings.net/#easeInOutSine

**Exit Criteria:**
- ✅ Blend factor implemented in updateFromPointer
- ✅ Hover influence fades correctly at 0°, 45°, 90° (manual test)
- ✅ No sudden jumps or jank when transitioning between scroll and hover
- ✅ Glare effects still work correctly at all angles
- ✅ TypeScript compiles
- ✅ Build succeeds

---

#### 3.2 Execution
*(To be filled after implementation)*

---

#### 3.3 Diffs
*(To be filled with unified diffs)*

---

#### 3.4 Inline Comments Added in Code
```tsx
// Reason: Blend factor prevents coordinate space issues when card is rotated by scroll.
// At 90° scroll (card edge-on), hover left/right would incorrectly become front/back rotation.
// cos() naturally fades hover influence: 100% at 0°, 0% at 90°.
const hoverBlend = Math.cos((scrollRotation * Math.PI) / 180);
```

---

#### 3.5 Results
*(To be filled after testing)*

---

#### 3.6 Review
*(To be filled by reviewer)*

---

### Phase P3 — Card Back Face Implementation

#### 3.1 Plan

**Intent:** Create compelling back face content for the card with the same material quality (shine, glare, edge effects) as the front face.

**Edits:**
1. **File:** `src/components/Cards/CardBack.tsx` (new)
   - **Operation:** add
   - **Rationale:** Dedicated component for card back content
   - **Method:**
     - Display aggregated content preview (e.g., "Explore Topics", category grid)
     - Use semantic HTML for accessibility
     - Support light/dark themes via `useColorMode`
     - Mirror front face structure for consistent material effects
     - Render category icons/links from `CARD_ENTRIES` array
   - **Props:**
     ```tsx
     interface CardBackProps {
       colorMode: 'light' | 'dark';
       entries: readonly CardEntry[];
     }
     ```

2. **File:** `src/components/Cards/HomepageCard.tsx`
   - **Operation:** modify
   - **Rationale:** Integrate CardBack into card structure
   - **Method:**
     - Import CardBack component
     - Pass CARD_ENTRIES and colorMode as props
     - Render CardBack inside `.card__back` (existing back face image element)
     - Currently line 740-744 has `<img className="card__back" src={back} />` - replace or wrap

3. **File:** `src/components/Cards/CardBack.module.css` (new)
   - **Operation:** add
   - **Rationale:** Styles specific to back face content
   - **Method:**
     - Grid layout for category icons (3x3 or 4x4)
     - Typography for heading/subtext
     - Color scheme matching front face
     - Ensure readability when rotated
     - Match card aspect ratio (--card-aspect: 0.718)

**Commands:**
```bash
npm run typecheck
npm run build
```

**Tests Expected:**
- **Test:** Scroll page past 90°, verify back face appears
  - **Expectation:** Back face content visible and properly styled
- **Test:** Check back face in light and dark modes
  - **Expectation:** Both modes display correctly with appropriate contrast
- **Test:** Verify material effects (shine, glare) on back face
  - **Expectation:** Same quality as front face (inherit from `.card__back` CSS)

**Links:**
- CSS backface-visibility: https://developer.mozilla.org/en-US/docs/Web/CSS/backface-visibility
- 3D card flip: https://3dtransforms.desandro.com/card-flip

**Exit Criteria:**
- ✅ CardBack component exists with meaningful content
- ✅ Back face visible when card rotates past 90°
- ✅ Material effects (shine, glare) work on back face
- ✅ Both light/dark modes supported
- ✅ No visual glitches during rotation
- ✅ Content is readable and accessible

---

#### 3.2 Execution
*(To be filled after implementation)*

---

#### 3.3 Diffs
*(To be filled with unified diffs)*

---

#### 3.4 Inline Comments Added in Code
*(Document any non-obvious implementation details)*

---

#### 3.5 Results
*(To be filled after testing)*

---

#### 3.6 Review
*(To be filled by reviewer)*

---

### Phase P4 — Animated Progress Indicator

#### 3.1 Plan

**Intent:** Add a visually appealing progress indicator on the right side that shows scroll progress, appears during scroll, and auto-hides 1 second after scroll stops.

**Edits:**
1. **File:** `src/components/ScrollProgressBar.tsx` (new)
   - **Operation:** add
   - **Rationale:** Dedicated component for scroll progress visualization
   - **Method:**
     - Accept `scrollProgress` prop (0-100) from parent
     - Track `isScrolling` state internally with debounced timeout (1s)
     - Render fixed-position bar on right edge
     - Animate opacity based on isScrolling state
     - Use CSS transitions for smooth fade in/out
   - **Props:**
     ```tsx
     interface ScrollProgressBarProps {
       scrollProgress: number; // 0-100
     }
     ```

2. **File:** `src/components/ScrollProgressBar.module.css` (new)
   - **Operation:** add
   - **Rationale:** Styles for progress indicator
   - **Method:**
     - Fixed position: `right: 0; top: 0;`
     - Height based on scroll: `height: calc(var(--scroll-progress) * 1%)`
     - Width: 4px desktop, 3px mobile
     - Glassmorphism: `backdrop-filter: blur(10px)`, `background: rgba(255,255,255,0.2)`
     - Smooth transitions: `opacity 300ms, height 100ms`
     - Z-index: above content (100), below modals (1000)

3. **File:** `src/pages/index.tsx`
   - **Operation:** modify
   - **Rationale:** Add progress bar to homepage
   - **Method:**
     - Import ScrollProgressBar component
     - Call useScrollProgress hook
     - Render ScrollProgressBar outside Layout (as sibling to main)
     - Pass scrollProgress prop

**Commands:**
```bash
npm run typecheck
npm run build
```

**Tests Expected:**
- **Test:** Start scrolling, verify progress bar appears
  - **Expectation:** Bar fades in within 100ms
- **Test:** Stop scrolling, wait 1s, verify progress bar disappears
  - **Expectation:** Bar fades out after 1s delay
- **Test:** Scroll to bottom, verify progress bar at 100% height
  - **Expectation:** Bar fills entire viewport height

**Links:**
- Debouncing in React: https://www.developerway.com/posts/debouncing-in-react
- CSS backdrop-filter: https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter

**Exit Criteria:**
- ✅ Progress bar component renders on right edge
- ✅ Bar height accurately reflects scroll progress
- ✅ Auto-show on scroll start
- ✅ Auto-hide 1s after scroll stop
- ✅ Smooth opacity transitions
- ✅ Glassmorphism styling applied

---

#### 3.2 Execution
*(To be filled after implementation)*

---

#### 3.3 Diffs
*(To be filled with unified diffs)*

---

#### 3.4 Inline Comments Added in Code
*(Document any non-obvious implementation details)*

---

#### 3.5 Results
*(To be filled after testing)*

---

#### 3.6 Review
*(To be filled by reviewer)*

---

### Phase P5 — Mobile & Desktop Responsiveness

#### 3.1 Plan

**Intent:** Ensure smooth performance and appropriate styling across all device sizes, with special attention to mobile touch scroll behavior.

**Edits:**
1. **File:** `src/components/ScrollProgressBar.module.css`
   - **Operation:** modify
   - **Rationale:** Adjust progress bar size for mobile
   - **Method:**
     - Media query: `@media (max-width: 768px) { width: 3px; }`
     - Ensure no overlap with content
     - Maintain glassmorphism effect on mobile

2. **File:** `src/hooks/useScrollProgress.ts`
   - **Operation:** modify
   - **Rationale:** Optimize scroll listener for mobile
   - **Method:**
     - Ensure `passive: true` for scroll listener
     - Add `requestAnimationFrame` throttling to reduce updates to 60fps
     - Test on actual mobile device (iPhone, Android)

**Commands:**
```bash
npm run typecheck
npm run build
npm run start  # Manual testing on device
```

**Tests Expected:**
- **Test:** Open on mobile device, scroll with touch
  - **Expectation:** Smooth 60fps animation, no jank
- **Test:** Test on viewport widths: 320px, 375px, 768px, 1024px, 1920px
  - **Expectation:** Layout adapts appropriately at each breakpoint
- **Test:** Verify progress bar doesn't overlap content
  - **Expectation:** Clear separation on all screen sizes

**Links:**
- Mobile touch performance: https://web.dev/articles/mobile-touch-performance
- CSS will-change: https://developer.mozilla.org/en-US/docs/Web/CSS/will-change

**Exit Criteria:**
- ✅ Smooth scroll animation on mobile (60fps)
- ✅ Works on viewport widths 320px-2560px
- ✅ Progress bar properly sized for mobile
- ✅ No content overlap or layout issues
- ✅ Touch scroll feels natural and responsive

---

#### 3.2 Execution
*(To be filled after implementation)*

---

#### 3.3 Diffs
*(To be filled with unified diffs)*

---

#### 3.4 Inline Comments Added in Code
*(Document any non-obvious implementation details)*

---

#### 3.5 Results
*(To be filled after testing)*

---

#### 3.6 Review
*(To be filled by reviewer)*

---

### Phase P6 — Playwright E2E Verification

#### 3.1 Plan

**Intent:** Create comprehensive automated tests using Playwright MCP tools to verify all functionality, controller state transitions, and prevent regressions.

**Edits:**
1. **File:** `tests/homepage-card-flip.spec.ts` (new)
   - **Operation:** add
   - **Rationale:** Automated E2E tests for scroll-driven card flip and controller states
   - **Method:**
     - **Test 1:** Navigate to homepage
     - **Test 2:** Scroll down, verify card rotation increases (check CSS transform)
     - **Test 3:** Scroll to bottom, verify card shows back face
     - **Test 4:** Scroll back up, verify card returns to front
     - **Test 5:** Verify progress bar appears during scroll
     - **Test 6:** Wait 1s, verify progress bar disappears
     - **Test 7:** Hover card while at 0° scroll, verify existing hover effects work
     - **Test 8:** Hover card while at 90° scroll, verify blend factor reduces hover
     - **Test 9 (NEW):** Scroll, then hover during scroll - verify pointer takes priority
     - **Test 10 (NEW):** Hover, then scroll while hovering - verify pointer maintains control
     - **Test 11 (NEW):** Test on mobile viewport (375x667)
     - **Test 12 (NEW):** Verify showcase animation still works (if not scrolled)

**Commands:**
```bash
npx playwright test tests/homepage-card-flip.spec.ts
```

**Tests Expected:**
- **Test:** Scroll triggers card flip
  - **Expectation:** Card rotation observed in computed styles (`transform: rotateY(...)`)
- **Test:** Progress bar visibility
  - **Expectation:** Bar visible during scroll, hidden after 1s
- **Test:** Mobile viewport
  - **Expectation:** All functionality works on 375x667 viewport
- **Test:** Hover interactions preserved
  - **Expectation:** Card responds to hover events as before
- **Test:** Controller state conflicts
  - **Expectation:** Pointer always wins over scroll, scroll defers gracefully

**Links:**
- Playwright docs: https://playwright.dev/
- Testing 3D transforms: CSS computed styles inspection
- Playwright MCP tools: Available via mcp__playwright__ namespace

**Exit Criteria:**
- ✅ All Playwright tests pass
- ✅ Card flip verified programmatically
- ✅ Progress bar show/hide verified
- ✅ Mobile viewport tested
- ✅ Controller state transitions tested (scroll vs pointer)
- ✅ Blend factor verified at 0°, 90° scroll positions
- ✅ No regressions on existing hover/orientation/showcase effects
- ✅ Tests run successfully in CI

---

#### 3.2 Execution
*(To be filled after implementation)*

---

#### 3.3 Diffs
*(To be filled with unified diffs)*

---

#### 3.4 Inline Comments Added in Code
*(Document any non-obvious implementation details)*

---

#### 3.5 Results
*(To be filled after testing)*

---

#### 3.6 Review
*(To be filled by reviewer)*

---

## 4) CROSS-PHASE TRACEABILITY

| Acceptance Criterion | Phases | Files | Verification |
|---------------------|--------|-------|--------------|
| AC1: Scroll down flips card via rotateDeltaSpring | P0, P1 | Card.tsx, useScrollProgress.ts | Playwright: scroll event → rotateDeltaSpring → transform |
| AC2: Scroll up returns card | P1 | useScrollProgress.ts, Card.tsx | Playwright: reverse scroll → rotation decreases |
| AC3: Back face material effects | P3 | CardBack.tsx, base.css | Visual test: shine/glare on back face |
| AC4: Progress indicator auto-hide | P4 | ScrollProgressBar.tsx | Playwright: scroll stop → wait 1s → opacity 0 |
| AC5: Mobile & desktop work | P5 | useScrollProgress.ts, ScrollProgressBar.module.css | Playwright: test viewports 375px, 1920px |
| AC6: Existing hover preserved with blend | P2 | Card.tsx (blend factor) | Playwright: hover at 0° vs 90° scroll |
| AC7: Controller state handling | P0, P1 | Card.tsx (state machine) | Playwright: scroll + hover → pointer wins |
| AC8: Playwright verified | P6 | homepage-card-flip.spec.ts | CI: all tests green |

---

## 5) POST-TASK SUMMARY

*(To be filled at completion)*

**Task Status:** planning (v2)
**Merged To:** *(branch or tag)*
**Delta:**
- Files Added: TBD
- Files Modified: TBD
- Files Deleted: 0
- LOC Added: ~280 (estimated, up from v1's 220 due to P0, P2)
- LOC Removed: 0

**Key Diff Refs:** *(to be filled)*

**Remaining Risks:** *(if any)*

**Followups:** *(T# or issue links)*

---

## 6) QUICK CHECKLIST

- [ ] Phases defined with clear exit criteria
- [ ] Each change has rationale and test
- [ ] Architecture validated against actual code (Card.tsx, CardProxy.tsx)
- [ ] Controller state machine integration documented
- [ ] Transform layer corrected (rotateDeltaSpring, not parent)
- [ ] Blend factor prevents coordinate space issues
- [ ] Diffs captured and readable
- [ ] Lint/build/tests green
- [ ] Acceptance criteria satisfied
- [ ] Review completed (per phase)
- [ ] Rollback path documented

---

## 7) ARCHITECTURE VALIDATION

**v1 → v2 Corrections:**

| Aspect | v1 (WRONG) | v2 (CORRECT) | Evidence |
|--------|-----------|--------------|----------|
| **Transform Layer** | Apply to `.cardContainer` parent | Use `rotateDeltaSpring` → `.card__rotator` | Card.tsx:721-758, base.css:143-147 |
| **Controller Integration** | Not addressed | Add 'scroll' to state machine | Card.tsx:91 union type |
| **State Conflicts** | Not addressed | Explicit priority: pointer > scroll | Card.tsx:247, 437, 583 |
| **Transform Composition** | Not addressed | Blend factor at 90° | Mathematical analysis |
| **Phase Order** | P1→P2→P3→P4→P5 | P0→P1→P2→P3→P4→P5→P6 | P0 is foundation |

**Critique Findings → v2 Integration:**

| Finding | Status | Solution in v2 |
|---------|--------|----------------|
| Transform layer conflict (CRITICAL) | ✅ FIXED | P1 uses rotateDeltaSpring, not parent |
| Controller state missing (HIGH) | ✅ FIXED | P0 adds 'scroll' to state machine |
| Transform composition math (MEDIUM) | ✅ FIXED | P2 adds blend factor |
| Test coverage gaps | ✅ FIXED | P6 adds controller state tests |

---

## 8) Optional: Minimal PR Message

```markdown
Title: T7 Homepage Card Scroll-Driven Flip Animation (v2 - Architecture Corrected)

Why:
- Improve homepage engagement with scroll-driven interactive card
- Provide visual feedback via animated progress indicator
- Showcase site's technical quality with polished UX
- Properly integrate with existing controller state machine

What:
- **Phase P0:** Integrated scroll controller into existing state machine ('idle' | 'pointer' | 'scroll' | 'orientation' | 'showcase')
- **Phase P1:** Created scroll progress hook that updates rotateDeltaSpring (not parent transform)
- **Phase P2:** Added blend factor to prevent coordinate space issues at 90° rotation
- **Phase P3:** Card rotates from front (0°) to back (180°) based on scroll progress
- **Phase P4:** Created CardBack component with material effects matching front face
- **Phase P5:** Added ScrollProgressBar component with auto-show/hide behavior
- **Phase P6:** Optimized for mobile and desktop with responsive CSS
- **Phase P7:** Verified via Playwright E2E tests including controller state conflicts

Architecture:
- Uses existing spring system (rotateDeltaSpring for scroll, rotateSpring for hover)
- Respects controller priority: pointer > showcase > scroll > orientation > idle
- Blend factor smoothly fades hover influence as card rotates (prevents 90° glitch)
- Zero changes to existing pointer/orientation/showcase behaviors

Tests:
- Playwright: scroll triggers flip, progress bar appears/hides, controller states
- Playwright: hover during scroll (pointer wins), blend factor at 0°/90°
- Manual: tested on Chrome/Safari/Firefox, iOS/Android
- Performance: verified 60fps on mobile with Chrome DevTools

Risks/Mitigations:
- Risk: Transform layer conflicts → Mitigated: Use rotateDeltaSpring, not parent transforms
- Risk: Controller state collisions → Mitigated: Explicit state machine integration with priority
- Risk: Coordinate space issues at 90° → Mitigated: Cosine blend factor fades hover influence
- Risk: Mobile performance → Mitigated: Passive listeners, RAF throttling, GPU transforms
```

---

## APPENDIX A: Controller State Machine Reference

**State Type (Card.tsx:91):**
```tsx
controllerRef: React.MutableRefObject<'idle' | 'pointer' | 'scroll' | 'orientation' | 'showcase'>
```

**Priority Order:**
```
pointer (highest) > showcase > scroll > orientation > idle (lowest)
```

**State Transition Rules:**
- **pointer:** Always wins, immediately takes control (Line 247)
- **showcase:** Waits for idle state, defers to pointer (Line 583-587)
- **scroll:** Defers to pointer/showcase, takes priority over orientation
- **orientation:** Lowest interactive priority, defers to all others (Line 437)
- **idle:** Default state, no active controller

**Spring Controllers:**
- `rotateSpring` → `--rotate-x`, `--rotate-y` (hover X/Y rotation)
- `rotateDeltaSpring` → `--rotate-delta-x`, `--rotate-delta-y` (scroll Y rotation)
- `glareSpring` → `--glare-x`, `--glare-y`, `--card-opacity`
- `backgroundSpring` → `--background-x`, `--background-y`
- `scaleSpring` → `--card-scale`
- `translateSpring` → `--translate-x`, `--translate-y`

**Final Transform (base.css:144-146):**
```css
.card__rotator {
  transform: rotateY(calc(var(--rotate-x) + var(--rotate-delta-x)))
             rotateX(calc(var(--rotate-y) + var(--rotate-delta-y)));
}
```
