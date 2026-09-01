# FLAKES & STAGING LAW — the ledger (2026-08-28)
Institutional memory: every class of headless nondeterminism met so far, and the idiom that beats it.

1. WORLD PERSISTS ACROSS startGame. Props, inter done-flags, banked state, moved objects all
   survive restarts by design (continue-style, mirrors SAVE). Every past "save-hydration" mystery
   was this. Idiom: never assume a fresh world after startGame — reset the specific inter/prop
   your section needs, AFTER a few ticks.
2. DEFERRED EVERYTHING. Hydration, tweens, popups apply on later ticks. Idiom: tick FIRST, then
   mutate (tick(6) before resetting a done-flag), never mutate-then-tick-and-hope.
3. SHARED FAR-CORNER DROPS. far() reuse piles props at one spot across sections; a later tap can
   grab/wear a neighbour. Idiom: isolate — teleport the target prop to clean ground before the assert.
4. AMBIENT AI FIGHTS PINS. Humans re-aim ry mid-update (wander/walk). Idiom: pin state='idle'
   (and patrol=null) INSIDE the loop, every frame, alongside position pins.
5. OWN YOUR NIGHT. nightT eases toward the auto-driver's verdict every frame. Idiom: tests set
   G.night=true AND G.nightManual=true (exactly what the N key does), never nightT alone.
6. ECONOMY-NEUTRAL LOOT. Anything a container spawns must not shadow a mission singleton or a
   counted economy (peg broke the clothesline count; muesli shadowed the scoff). Loot junk is
   'rubbish' only.
7. THE PERCH IDIOM. To interact at height: pin x/z/y with y=max(0.25, target, groundHeightAt+0.02)
   across 2-3 updates BEFORE the tap; repeat pins during holds.
8. HONK-CLASS INTERPLAY. Some detectors live inside emergent event branches (car must be
   obstruction-stopped AND honk). Staging-resistant headless; classify review-tier + 10s manual QA
   rather than burning calls. Time-box: ~3 attempts, then classify.
9. RENDERER TRUTHS (SwiftShader). Big-buffer readbacks kill the target; compositor stalls forever
   once RAF is frozen. Idiom: boot-size buffers, render-then-read in ONE evaluate, per-frame small
   exports, tolerant try/catch keeping landed frames.
10. ASSERTIONS DERIVE FROM ENGINE CONVENTION. When a constant is deliberately changed (scale law,
    seal path length), the test reads the convention (path.length-1), never re-hardcodes.
11. THE MISSION MATRIX HAS A RARE INTERMITTENT. Seen once (2026-09-01, the first and cold node
    invocation of the session): the everything battery reported "12 driven, 1 failed", then went
    green across 11 consecutive reruns — 8 standalone and 3 full gate-shaped serial passes. Not
    reproduced. The failing mission id was LOST, because gate.sh keeps only tail -1 per battery
    and the FAILED line scrolls past it. Idiom: the assertion message now names the ids, so the
    next occurrence identifies itself. Do not chase this one blind — capture the name, then stage
    that single mission. Review-tier under law 8. Counts confirmed by sabotage: one dead driver
    yields exactly "12 driven, 1 failed", so all 13 were attempted and precisely one did not
    complete.
12. A PHOTOGRAPH IS A STAGING CONTRACT, AND DRIFT AGAINST THE BASELINE IS NOT THE SAME QUESTION AS
    VARIANCE AGAINST YOURSELF. diff.mjs asks whether a frame changed since it was pinned; it
    cannot ask whether the frame is reproducible at all, so a vantage whose staging drifts with
    machine load reads as permanent drift no matter how often it is re-pinned - which is how
    22_torch_beam sat in BASELINE.md as "known-noisy" for four builds without a cause. Idiom: any
    vantage that leaves something LIVE during the settle must pin it every frame, and
    stability.mjs (takes compared against each other, baseline out of the picture) is the
    instrument that proves it. Three live things caught this way, all of them already covered by
    an earlier law nobody applied to the camera rig:
      - night eased back toward the day driver because nightManual was never set (law 5),
      - the follow cam lerped away from a directly-assigned camera position (only camLock holds),
      - the camp fire is four sines on G.time plus a Math.random spit, so freeze G.time and hold
        _fireSpit above zero to take the deterministic branch and never roll the random at all.
