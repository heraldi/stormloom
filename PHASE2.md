# Phase 2 handoff — 2026-11-16

## Shipped

- **Strikes-only release; no squalls.** The seeded director schedules locked-target `WARNING → IMPACT → RECOVERY` strikes: 1.5-second warning, 0.1-second impact, 0.4-second aftermath, 92-pixel blast radius. Cadence is 8–10 seconds on fronts 1–2, 7–9 on fronts 3–4, and 5–7 on fronts 5–6. Warning budget is at most two; ordinary cadence does not overlap warnings.
- Coral blast rings have an ivory shrinking countdown arc and a readable countdown label, offset from the targeted skiff and kept below the HUD. A distinct two-voice warning chord reuses existing synth methods; the audio engine is unchanged.
- Each strike resolves once: one hull damage for skiff overlap, otherwise 18 heat for an intersecting open wire. A hull-targeted strike never also heats the wire, even when immunity absorbs the hit. Sparks and strikes share one-second `hitCooldown`; every hull damage path honors the first six seconds of grace. Strike heat uses the existing overheat/circuit-destruction path.
- Strike state resets on seeding/restart and freezes on pause and retrofit menus. Defeats identify lightning, sparks, overheat, or dawn, including the front for impact/overheat causes.
- Start hides the live HUD, timer, hint, beacon, and inactive skiff. Controls no longer overlap; secondary text is brighter. Charge labels show the actual multiplier, heat is `/100`, and the heat bar marks its danger zone above 72.
- Result screens omit the live HUD and hint, use **FRONTS COMPLETED**, retain the real defeat subtitle, and place stats on an opaque panel. Charged open wires have thicker ivory cores and amber glow; harvested triangles briefly discharge inside their actual geometry. Sparks have larger coral glyphs. Reduced motion skips camera shake, new glows/pulses, and spark rotation while retaining readable fading marks.
- Energy/reward numbers, crossing heat, upgrade structure/numerical effects, fixed-step simulation, seeded RNG approach, file layout, dependencies, and offline runtime are unchanged. `vendor/` and `synth-audio.js` are unchanged.

## QA evidence

Tests live outside the repository in `~/makefun/stormloom-qa/`. Browser tests use actual keyboard/mouse input and detached `inspectRun()` telemetry, never scene setters, granted energy, invulnerability, or forced result screens.

| Gate | Result |
| --- | --- |
| Existing winning gate, strengthened to require victory | PASS: roughly 53 seconds, five harvests, 2,400 energy, two hull points |
| Charge / vent / overheat | PASS: charge sacrificed without gaining energy; one overheat damages hull and clears the unfinished net |
| Hull defeat | PASS: chased real sparks; specific spark/front subtitle |
| Strike dodge / target lock | PASS: escaped the first aimed warning without hull loss; target coordinates unchanged |
| Strike hit / defeat | PASS: stayed in warning centers; real defeat says `Struck by lightning on front 2` |
| Dawn defeat / both retrofit windows | PASS: six fronts completed, three hull points, Cooling Fins and Reinforced Hull selected |
| Pause / keyboard and mouse restart | PASS: complete diagnostic snapshot freezes during a warning; restart clears strikes, bonuses, upgrades, counters and energy, retaining settings |
| Console / page errors / network | None; full winning run makes no requests after its 13 local startup requests and no external requests |
| Reduced motion | PASS: winning run with comfort setting enabled; canvas instrumentation observed zero positive shadow-blur writes; camera shake/full-screen flash are gated off |
| Full-input simulation replay | PASS: identical seeded 1/60-step inputs and complete simulation snapshots, not just director RNG output |
| Actual-browser fixed-step replay | PASS: two fresh pages have identical full telemetry at seven keyboard-input checkpoints |
| Fairness probe | PASS: 20 seeded six-front runs, 499 warnings; all targets locked; maximum observed concurrent warning count 1 (budget 2) |
| Escape margin | Worst sampled center escape 0.467 seconds, including current velocity, steering response and walls; below half the 1.5-second warning (0.75 seconds) |
| Geometry / rejected nets / bounded effects / numerical upgrades / guard | PASS |
| Hand-in determinism / vendor | PASS: two fresh `MAKEFUN_OUTPUT_DIR` executions byte-identical; vendor matches v18 starter |
| v18 repository/transcript precheck | **13 passed, 0 failed, 6 skipped, 5 checked at submission** |

The old stationary-wait edge harness died to the newly added strikes, so its waits now dodge warnings through ordinary input and return to a safe area. Its hull-guard check permits an actually consumed guard. Browser clocks are installed and paused before navigation. Replay inputs are synchronized to simulation ticks rather than renderer/navigation timing; equal wall-time key holds can straddle different RAF boundaries without being identical fixed-step inputs. A QA server also reached its background time limit; it was restarted and all final gates rerun successfully. No game balance was changed to rescue these tests.

Reusable commands (run servers separately; `phase2-browser.py` and capture use port 8082):

```sh
node serve.ts
node serve.ts --port 8082
~/makefun/stormloom-qa/venv/bin/python -I ~/makefun/stormloom-qa/gate.py
~/makefun/stormloom-qa/venv/bin/python -I ~/makefun/stormloom-qa/edge_cases.py
~/makefun/stormloom-qa/venv/bin/python -I ~/makefun/stormloom-qa/phase2-browser.py
node ~/makefun/stormloom-qa/logic-check.mjs
node ~/makefun/stormloom-qa/phase2-logic.mjs
```

Evidence: `phase2-browser-report.json`, `phase2-edge-report.json`, `phase2-logic-report.json`, `phase2-browser-replay.json`, `phase2-capture-report.json`, and the gate/check logs in that external QA directory. The separate replay script also passes independently.

## Screenshots and provenance

All four replacement images are real, unedited 1280×760 Chromium captures taken after the gameplay gates passed: a charged 221-energy harvest with a visible strike warning, clean start, actual victory, and actual lightning defeat. Each is below 73 KB, far below 256 KiB. `shots.json` explains the transient harvest, reset multiplier, earned stats, settings and capture method honestly. The capture script is external: `phase2-capture.py`. Final image inspection caught a warning label behind the skiff; its placement was fixed, all gameplay gates rerun, then the final scenes recaptured.

The separate `makefun record` launch did **not** start: its log says this competition takes uploaded transcript bundles instead. Provenance therefore uses the genuine native build-session recordings, exported with the v18 `bundle` command, including both build sessions and discovered families. No transcript was manufactured or rewritten. The final bundle is external at `~/makefun/stormloom-qa/phase2-transcripts.tar.gz`; export it again after future work.

The check uses the entry repository, not the kit as `--repo`; add `--worktree` before committing, omit it to validate committed HEAD:

```sh
node ~/makefun/bestgame-kit-v18/cli/makefun.mjs check \
  --kit ~/makefun/bestgame-kit-v18 --repo ~/makefun/stormloom \
  --transcripts ~/makefun/stormloom-qa/phase2-transcripts.tar.gz
```

## Remaining risks / next phase

- Squalls were deliberately deferred rather than shipping an unverified three-strike overlap/escape-corridor design. This phase claims only fair, standalone telegraphed strikes.
- The 20-seed probe establishes a sampled geometric escape margin, not a proof that every combination of sparks, voluntary overheating and player decisions is safe. Do not remove the margin or add overlapping hazards without new browser/fairness probes.
- The kit auto-discovers older outside-project sessions from historical reads and notes two missing archived subagent records in one such family. The current build sessions are present and local checks still pass; preserve that disclosure and resolve archive completeness before final submission. Gitleaks is unavailable locally; the kit used its built-in transcript redaction.
- Public ownership, repository creation time, pushed revision and other server-only checks remain deferred. Local `check` is not a game grade or a submission. **No submission was made.**
