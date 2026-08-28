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
