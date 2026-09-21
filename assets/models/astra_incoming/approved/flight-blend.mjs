// Engine-independent target weights for the named flight clips.
// power: 0 = glide, 1 = flap. turn: -1 = left, +1 = right.
// Smooth mixer weights over approximately 0.24 s. Heading and travel belong
// to the game controller; bank clips supply posture, not root-motion turns.
export function flightWeights(power, turn) {
  if (!Number.isFinite(power) || !Number.isFinite(turn)) throw new TypeError('Finite flight inputs required');
  const p = Math.max(0, Math.min(1, power));
  const t = Math.max(-1, Math.min(1, turn));
  return {
    flight_loop: p,
    flight_glide: (1-p)*(1-Math.abs(t)),
    flight_bank_left: (1-p)*Math.max(0,-t),
    flight_bank_right: (1-p)*Math.max(0,t),
  };
}
