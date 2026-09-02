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
11+13 (SUPERSEDED 2026-09-02). The unreproducible red battery was never the cold node. The batteries
    ran unseeded, so each run built a different country and threw props to different places; the
    drivers that grab one named prop out of a pile failed at a few percent. rig.js now seeds both
    the game rng and Math.random at capture.mjs's seed 20260828, and every battery is byte-identical
    run to run. A red battery now MEANS something. If one ever fails to reproduce again, suspect a
    new unseeded draw, not the machine - and check harness-audit-pass2, the one battery whose
    transcript once varied for a reason I could not attribute.
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
14. AN ASSERTION THAT READS STATE ONLY PRESENT WHEN THE CODE WORKS IS NOT AN ASSERTION, IT IS A FUSE.
    `ok(thing().field===x, ...)` throws when thing() is undefined, and a battery that throws prints a
    stack trace and NO verdict - so the sabotage you were checking for comes back with zero findings
    and reads as a gap in the test. Session 9 met this four times and wrote it in the log as a guard
    rule; session 10 met it FOUR MORE TIMES in one night - in a save blob slot, a travel beat held-key
    map, and three separate reads of one hint - so it is law now. Idiom: read through an accessor that
    cannot throw, and put the value in the message.
      const cageF=k=>(cage()||{})[k];          const heldOf=c=>((G.travel||{}).held||{})[c];
      const stars=id=>((blob.biomes||{})[id]||{}).stars||{};
    The tell is that a sabotage returns NOTHING. Zero findings from a sabotage that obviously breaks
    the feature is not proof the test is thin - check for a stack trace FIRST. In every one of the
    eight cases the test was fine and one read was a fuse.
15. ANY SECTION THAT BUILDS A WORLD MOVES THE SEEDED STREAM FOR EVERY SECTION AFTER IT. propAt keeps
    a deliberate rnd draw per prop (TODO 47, _ryUnused) precisely so the country does not move when a
    name changes - which means adding or removing a section that boots shifts which prop a LATER
    section picks up. A bound that happens to hold for one prop is a time bomb: piece 38 added two
    boots and a four-build-old assertion in the carry-back section failed, because it asked for
    hypot <= BAND.off while botchWonk draws x and z INDEPENDENTLY (the corner of the band is off times
    root two). Law 10 already says read the convention; this is what it costs when one assertion in
    four does not. Idiom: derive the bound from how the value is CONSTRUCTED, per axis if it is drawn
    per axis, and never from the number one prop happened to produce.
