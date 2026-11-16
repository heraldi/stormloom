# Phase 1 handoff — 2026-11-16

## Gate status

The full playable loop is implemented and browser-tested: Start → steer → place → stretch → preview → seal → harvest → reposition → victory or defeat → immediate restart. The game runs offline from `game/` with procedural Canvas 2D and native WebAudio.

- Six fronts, 32 seconds each; 2,400-energy beacon goal; three-point hull.
- Ivory conductive wires gain charge and heat when ambient lightning crosses them. Ambient collection lightning is not yet a damaging strike hazard.
- Drifting coral sparks damage the hull. Initial spawn clearance and temporary impact protection give the player time to react. Later fronts increase spark density and drift speed.
- Open wires cool slowly. Overheat destroys the unfinished circuit and costs one hull point. E sacrifices charge and clears the wire, permitting faster cooling.
- Preview includes an approximate energy return; sealing shows a short-lived triangular lace and harvest feedback. Degenerate/duplicate placements do not farm energy.
- Numerical, exclusive retrofit choices after fronts 2 and 4 are already functional. Their menus remain frozen until a choice is made.
- Pause includes mute and reduced-motion toggles, plus master-volume adjustment. Settings survive restart; earned upgrades, hull guards, heat, energy, score, and counters do not.
- The simulation advances in fixed 1/60-second steps, rendering separately. Storm randomness is seeded, static sea contours are cached to an offscreen canvas, and gameplay uses a fixed 1280×760 backing surface rather than multiplying by device pixel ratio. Effects are capped at 192 active records.

## Verified in the actual browser

Python Playwright tests are intentionally outside the repository in `~/makefun/stormloom-qa/`. They serve the unmodified production files using `node serve.ts`, drive ordinary mouse/keyboard input, and take unedited browser screenshots. `inspectRun()` in `game/main.js` returns a detached diagnostic snapshot; it offers no setters, energy grants, scene overrides, or invulnerability. The tests use it to assert what the actual input-driven game did.

Latest regression results:

| Check | Result |
| --- | --- |
| Start click and control response | PASS |
| Two-buoy preview and three-buoy harvest | PASS |
| Full winning run | PASS: front 3, two fronts completed, five harvests, 2,400 energy, two hull points remaining, Lace Amplifier selected |
| Hull-loss defeat | PASS: pursued real drifting sparks with the skiff |
| Dawn-loss defeat | PASS: six fronts completed with insufficient energy and intact hull |
| Charge and vent | PASS: charged wire cleared without gaining energy |
| Overheat | PASS: one hull point lost and unfinished net cleared |
| Retrofit choices | PASS: numerical cooling, harvest, mobility, and hull-guard effects; one choice per window |
| Pause, mute, volume, reduced motion | PASS; timer stops while paused |
| Mouse and keyboard restart | PASS; run bonuses/counters reset, comfort settings retained |
| Console / page errors | None in the winning run |
| External requests | None in the winning run |
| Fixed-seed replay | Identical simulation bytes for identical fixed-step input |
| Geometry / invalid nets / bounded effects | PASS in supplementary logic checks |
| Kit vendor library | Byte-identical to the starter copy |
| Hand-in determinism | Two fresh output directories match byte-for-byte |

QA commands on this VPS:

```sh
node serve.ts
~/makefun/stormloom-qa/venv/bin/python -I ~/makefun/stormloom-qa/gate.py
~/makefun/stormloom-qa/venv/bin/python -I ~/makefun/stormloom-qa/edge_cases.py
node ~/makefun/stormloom-qa/logic-check.mjs
```

The image files under `screenshots/` replace all starter imagery. They are provisional development captures from the real browser: preview/play, start, victory, and hull defeat. Final composition and capture remain phase-3 work. `shots.json` describes their provenance; empty queries do not bypass gameplay to manufacture a result screen.

## Early kit pre-submit check

The exact documented `bundle` and `check` commands were run against the pushed phase-one commit. Result: **13 passed, 0 failed, 6 skipped, 5 checked at submission**. Authorship coverage was **99.5%** of counted lines; the recorded-session, timestamps, pricing, revision, and run-record checks passed. This is a local repository/transcript precheck, not a server grade or a submission. Final bundling must run again after the later phases so their work is included too.

Both hand-in executions were byte-identical. At this milestone `game/` contains 13 files totaling about 52 KB, and each of the four real JPEG captures is under 55 KB, well below the competition caps. The vendor library comparison passes unchanged.

## Tuning evidence

The first moving-skiff tests revealed sluggish steering, disproportionately dense initial sparks, and rewards that could be farmed from nearly flat triangles. Steering now converges rapidly to the requested velocity; early sparks are sparse with a safe initial radius; duplicate anchors and triangles below 1,200 square units cannot harvest. Charge now produces a visible multiplier and sustained open-wire exposure can really overheat.

A subsequent large-triangle route filled a 900-energy prototype beacon in about 26 seconds, before any retrofit decision. The final phase-one target is 2,400: the same input-driven route reaches the first retrofit window and wins in roughly 75 simulated seconds. Small nets remain quicker but less productive; large, charged harvests are substantially stronger and more exposed.

## Remaining scope — phases 2 and 3

- Add telegraphed, damaging lightning strikes and pursuing squalls. These are not claimed complete.
- Further balance against those hazards; polish sound, sea/beacon art, and scene composition without changing the core loop.
- Final 3–4 screenshots and dossier inspection, using real gameplay.
- Finish GitHub About and verify submission-account ownership / claim-file requirements.
- Bundle every build session with the kit, run the exact kit pre-submit check, and resolve any transcript/branding issues before submission.
- Submit only in the submission phase, using the documented kit command and the account's signing wallet. No entry has been submitted by this phase-one work.
