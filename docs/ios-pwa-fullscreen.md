# iOS PWA fullscreen layout

## Symptom

When the app is opened from the iPhone home screen (standalone PWA mode), the bottom touch-control buttons sit below the visible screen and cannot be reached. In a normal Safari tab the layout looks correct.

## Why it happens

`index.html` sets `viewport-fit=cover`, so iOS reports non-zero safe-area insets in standalone mode (roughly 59px top on Face ID devices, 34px bottom for the home indicator). In Safari tabs those insets are typically zero.

The bug appeared when safe-area insets were applied as `padding` on `body` while `.game-screen` used `height: 100dvh`. CSS box model math made the total content height `100dvh + top inset + bottom inset`, so the bottom of the app was clipped below the viewport. `.touch-controls` also added `padding-bottom` with the bottom inset, which would have double-counted it after a naive fix.

`computeCellSize` previously derived available height from `window.innerHeight` minus estimated header/control heights. That ignored safe-area insets and could oversize the canvas in standalone mode.

## The fix

1. **Safe-area inside the 100dvh shell** — Remove safe-area padding from `body`. Apply insets on `.screen` via `calc(1rem + env(safe-area-inset-*))`. `.game-screen` keeps `height: 100dvh` and sets bottom padding to `0`; `.touch-controls` alone applies the bottom inset with `padding-bottom: max(0.5rem, env(safe-area-inset-bottom))`.

2. **Measure the flex board area** — `.board-area` is `flex: 1; min-height: 0`. `computeCellSize` reads `boardArea.clientWidth` and `boardArea.clientHeight` and picks `floor(min(w / BOARD_WIDTH, h / BOARD_HEIGHT))`. A `ResizeObserver` on `.board-area` (plus `resize` / `orientationchange`) keeps the canvas in sync. `min-width: 0` and `overflow: hidden` on `.board-area` prevent the canvas from growing its parent.

## Rules to keep it working

- Do **not** put safe-area padding on `body` around a `100dvh` app shell — insets must live inside that box.
- Apply each inset **once** (bottom only on touch controls for the game screen).
- Do **not** use `position: fixed` on `body` / `#root` for iOS fullscreen (breaks on iOS 26).
- Size the canvas from the **measured flex container**, not `window.innerHeight` arithmetic.
- Keep `overflow: hidden` on `html` / `body` and `min-height: 0` on flex children that should shrink.
