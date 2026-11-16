# stormloom

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/heraldi/stormloom/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/heraldi/stormloom/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**STORMLOOM — Relight the beacon before dawn.** Steer a salvage skiff across an engraved, ink-blue sea. Place three conductive buoys to seal a triangular lightning net, harvest energy, and reposition. Stretch farther for larger returns; lightning crossing an open wire increases both its multiplier and its heat. Vent before the unfinished circuit overheats, and avoid drifting sparks with your three-point hull.

Phase 1 is playable: start, six storm fronts, two retrofit windows, victory, hull-loss and dawn-loss defeat, pause, and immediate restart. Telegraphed damaging strikes, pursuing squalls, the final art/audio pass, and the competition submission are reserved for phases 2–3. The screenshots currently show real development playtests, not a final promotional capture.

## Run it

```sh
node serve.ts
```

Open `http://localhost:8080` in a desktop browser. Node.js 22.18 or later is needed for the development server and hand-in program. The game itself is static Canvas 2D and native WebAudio: no build step, package install, remote assets, fonts, or runtime network calls.

### Controls

| Input | Action |
| --- | --- |
| WASD | Steer the skiff |
| Space | Drop a conductive buoy; the third corner seals and harvests |
| E | Vent an unfinished net and sacrifice its charge |
| Esc | Pause / resume |
| 1 / 2 | Choose one retrofit after fronts 2 and 4 |
| R on a result screen | Restart immediately |
| M / R while paused | Toggle mute / reduced motion |
| + / − while paused | Adjust master volume |

Fill the beacon to **2,400 energy** before the sixth 32-second front expires. Preview text estimates the next harvest. Nets with less than 1,200 square units of area cannot harvest; flat, overlapping anchors are not a source of free energy. Open wires cool slowly; venting or harvesting allows faster hull cooling. Coral sparks damage the hull, while ivory wire and preview geometry remain readable with reduced motion enabled.

### Deterministic hand-in

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` and writes the dossier using the unchanged kit library in `vendor/makefun-game.ts`. Development testing and remaining scope are recorded in [PHASE1.md](PHASE1.md).

---

<sub>Entered on [make.fun](https://make.fun/?ref=h7y916we&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
