# Safety Guards (Non-negotiable)

FOMOff prioritizes safety over coverage. These guards prevent any default behavior from interfering with checkout or essential UI.

## What we skip by default
- Form controls: `input`, `select`, `textarea`, `button`.
- Interactive elements: links, buttons, and menuitems (including `role="button"` and `role="link"`).
- Checkout/price surfaces: elements whose IDs, classes, or labels indicate price, totals, cart, payment, shipping, or checkout.
- Explicit opt-out markers: any element with `data-fomoff-critical` (or any ancestor with that attribute).

## Why it matters
These elements are the highest risk for accidental breakage. We choose to be conservative and leave them untouched by default.

## How it works
The guard is enforced before treatment is applied. If an element is considered critical, it is not muted or collapsed.

## Developer override (local only)
If you control the page (e.g., the demo page), you can mark critical areas to keep them untouched:

```html
<div data-fomoff-critical>
  <!-- checkout totals, shipping price, or other critical UI -->
</div>
```

## Trade-offs
Some forced add-ons inside checkout flows may be skipped. This is intentional to avoid breaking purchase paths.
