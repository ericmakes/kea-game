# KEA GAME — MASTER EXPORT
*Assembled 2026-09-05. Everything about this project in one place.*

---

## WHAT THIS PROJECT IS

A browser game about a kea (the New Zealand alpine parrot) causing chaos in a
South Island carpark. Two multiplayer modes, a six-map tour, ~95 interactables,
built and certified by an autonomous AI pipeline called **the gauntlet**, and
currently mid-way through a re-platform to photoreal rendering.

Its visual target is the trailer in `03_visual_references/` — HexNest Games'
*Birds of War*. Kea instead of magpie, NZ alps instead of Australian suburbia.

## READ IN THIS ORDER

1. `01_system/SESSION_LOG.md` — the whole project arc and every decision made.
   **Start here.** It's the fastest path to understanding where things stand.
2. `01_system/THE_GAUNTLET_EXPLAINED.md` — how the build/test/certify machine
   works and how it's been run. The process is as much the project as the code.
3. `02_briefs/REPLAT.md` — the re-platform plan (P1–P6), what's done, what's not.
4. `02_briefs/P5E.md` — the current piece: turning the cockatoo model into a kea.
5. `02_briefs/ASTRA_BRIEF.md` — the same task, written for an external AI.
6. `04_deployment/DEPLOYMENT.md` — GitHub + Netlify, not yet set up.

## WHAT'S IN HERE vs WHAT'S ON THE MAC

This export is the CONTEXT — plans, history, references, process. The living
project is on Eric's Mac at `~/kea-gauntlet-portable`:

- the game source (Vite project, `src/`)
- the actual gauntlet code (nine batteries, gate.sh, the tripwire instruments,
  FLAKES.md, OVERNIGHT.md, WAVES.md, TODO.md, ARTBIBLE.md, the logs)
- the assets (bird models, scanned textures, HDRIs)
- the full git history on two branches

`05_mac_side/PULL_FROM_MAC.md` has a paste-block that folds those into this
folder to make a genuinely complete archive.

## CURRENT STATE (2026-09-05)

- Branch `gauntlet`: the last certified pre-re-platform build. Frozen.
- Branch `replat-b`: the photoreal re-platform. P1 (renderer), P2 (sky/sun),
  P3 (scanned materials), P4 (instanced grass) all certified. P5 (the bird) in
  progress — the model is bound, de-crested and recoloured; the kea pass
  (P5E.md) is the live work.
- Open after the bird: P6, the full geometry pass over every remaining
  primitive (trees, mountains, hut roof, carpark, rocks, props, vehicles).
- Never scoped: audio, mobile/touch, gamepad, shipping.

---

# COLD BOOT — resuming this project in a fresh session

Paste this to any capable AI along with this export:

> This is the kea game project. Read `01_system/SESSION_LOG.md` for the arc and
> every decision made, then `01_system/THE_GAUNTLET_EXPLAINED.md` for the
> process, then `02_briefs/REPLAT.md` for the current plan. The live repo is on
> my Mac at `~/kea-gauntlet-portable`, branch `replat-b`. The laws that matter:
> one piece per commit with its proof in the same commit; the gate must print
> CERTIFIED-SHIP before anything ships; one writer owns the tree at a time
> (SESSION.lock); the machine proves correct, I judge good; taste work
> (anything about how it LOOKS) is never done blind overnight — build me 2-3
> variants and let me pick. Visual targets are in `03_visual_references/` —
> the Birds of War trailer is the definitive bar, the kea photos are the truth
> for the bird. Ask before changing direction; tell me plainly when a brief I
> wrote turns out to be wrong against the actual file.

## THE HUMAN'S RECURRING JOB (what Eric actually does)

1. Launch a run: `caffeinate -i claude --dangerously-skip-permissions "Read
   OVERNIGHT.md and begin the overnight gauntlet."`
2. Morning: `cat REPORT.md`, verify with `bash gauntlet/verify/gate.sh`.
3. Judge any flagged frames — approve (re-pin) or reject.
4. For look work: sit in on a supervised session and pick between variants.

Everything else runs itself.
