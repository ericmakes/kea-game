// Target weights for a standard animation mixer. Blend toward these over
// ~0.2 seconds; keep walk_loop and carry_walk at the same cycle phase.
// The game supplies translation, turning and terrain/contact correction.
export function groundWeights(movement, carrying=false) {
 if (!Number.isFinite(movement)) throw new TypeError('Finite movement weight required');
 const w=Math.max(0,Math.min(1,movement));
 return {watch_idle:carrying?0:1-w,walk_loop:carrying?0:w,
         carry_idle:carrying?1-w:0,carry_walk:carrying?w:0};
}
export const groundPlayback={
 cycleSeconds:1,
 stanceFraction:.62,
 forwardSourceUnitsPerSecond:6/.62,
 transitionSeconds:.2,
 turnOwner:'game controller',
 carryAttachment:'CARRY_ATTACHMENT.json',
};
