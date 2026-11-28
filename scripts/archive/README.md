# Archived design-phase probes

These scripts were used while the home page, ad containers and performance
budget were designed. They are **unmaintained**, are **not wired into CI**, and
depend on a local preview server already running on `http://localhost:4321`.
They are kept for reference because the methods are still useful; the live
checks are the Playwright suite, `pnpm check:csp`, `pnpm perf:lighthouse` and
the uptime probe.

Start a preview first:

```bash
pnpm build
pnpm preview --port 4321
```

Then run any file directly, for example:

```bash
node scripts/archive/perf.mjs
```

| Script               | What it did                                                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ad-cls.mjs`         | Injected mock creatives into every ad slot and measured layout shift (CLS) and slot height before/after, to prove the reserved boxes do not move the page.              |
| `axe-check.mjs`      | Ran axe-core against 10 representative routes and printed violation counts, as an early accessibility smoke before the Playwright axe suite existed.                    |
| `inp.mjs`            | Throttled mobile emulation with a PerformanceObserver for pointer/click/keydown event timing; measured the home page pause control and command palette.                 |
| `inp-tool.mjs`       | Same event-timing probe against the hourly-rate calculator: typed an income, submitted, and printed the slowest interaction durations.                                  |
| `js-weight.mjs`      | Walked the built home page’s script, island and renderer URLs, followed relative imports in `dist/`, and printed the largest gzip-compressed files plus a total.          |
| `keyboard-check.mjs` | Keyboard walk on a phone viewport: first Tab target, mobile menu open/close focus, Escape, and Command/Ctrl+K palette focus.                                             |
| `perf.mjs`           | Throttled mobile lab run (CPU 4×, 1.6 Mbps down, 150 ms latency) over five routes; printed LCP, CLS, a long-task/TBT proxy, load timings, transfer size and shifts.      |
| `shoot.mjs`          | Screenshot helper for redesign checkpoints: URL, output path, viewport, full-page flag, scroll offset and reduced-motion flag; declined the consent card before capture. |
| `width-check.mjs`    | Loaded the home and hourly-rate pages at 320–2560 px and reported horizontal overflow and key element widths.                                                          |

The scripts are excluded from product coverage by construction (coverage only
includes `src/lib/calculators` and `src/lib/generators`). ESLint still checks
them; if one is revived, bring it up to the current lint and formatting rules
and wire it into a package script instead of running it by hand.
