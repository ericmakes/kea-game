/**
 * EXPERIMENTAL: geometry acceptance is separate from this adapter's tests.
 *
 * Apply an external, pre-skinning rest correction to POSITION and NORMAL.
 * This module neither loads a GLB nor changes bones, skin influences, UVs,
 * indices, stored animations or bounds. It has no renderer dependency.
 */

const HASH = /^[a-f0-9]{64}$/i;
const COMPONENTS = ["getX", "getY", "getZ", "setXYZ"];

function requireAttribute(attribute, name, count) {
  if (!attribute || attribute.count !== count) {
    throw new RangeError(`${name}.count must equal vertexCount (${count}).`);
  }
  for (const method of COMPONENTS) {
    if (typeof attribute[method] !== "function") {
      throw new TypeError(`${name}.${method} must be a function.`);
    }
  }
}

function requireFiniteArray(values, name, length) {
  if ((!Array.isArray(values) && !ArrayBuffer.isView(values)) ||
      values.length !== length) {
    throw new RangeError(`${name} must contain exactly ${length} numbers.`);
  }
  for (const value of values) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new TypeError(`${name} must contain finite numbers.`);
    }
  }
}

function unitVector(x, y, z, row) {
  // Scale before taking the length so finite, very large normal components
  // cannot overflow their length and silently normalize to a zero vector.
  const scale = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
  if (scale === 0) throw new RangeError(`Normal must be nonzero at row ${row}.`);
  const sx = x / scale, sy = y / scale, sz = z / scale;
  const length = Math.hypot(sx, sy, sz);
  if (scale * length < 1e-12) {
    throw new RangeError(`Normal is too small at row ${row}.`);
  }
  return [sx / length, sy / length, sz / length];
}

/**
 * @param {object} options
 * @param {object} options.position BufferAttribute-like POSITION attribute.
 * @param {object} options.normal BufferAttribute-like NORMAL attribute.
 * @param {object} options.correction Validated against the version-1 schema.
 * @param {string} [options.loadedSourceGlbSha256] Caller-computed source hash.
 *   When supplied, it must match correction.sourceGlbSha256. This module does
 *   not read or hash the asset; omitting it leaves asset identity unverified.
 *
 * Capture the loaded base geometry once, before any correction is applied.
 * Attributes must be writable, non-normalized floating-point attributes.
 * BufferAttribute-style accessors make interleaved arrays safe to use.
 * The caller must not concurrently overwrite the same POSITION/NORMAL rows.
 */
export function createWingRestCorrection({
  position, normal, correction, loadedSourceGlbSha256,
} = {}) {
  if (!correction || correction.version !== 1) {
    throw new TypeError("correction.version must be 1.");
  }
  const { vertexCount, sourceGlbSha256 } = correction;
  if (!Number.isInteger(vertexCount) || vertexCount <= 0) {
    throw new RangeError("vertexCount must be a positive integer.");
  }
  if (typeof sourceGlbSha256 !== "string" || !HASH.test(sourceGlbSha256)) {
    throw new TypeError("sourceGlbSha256 must be a 64-character SHA-256 hex string.");
  }
  if (loadedSourceGlbSha256 !== undefined &&
      (typeof loadedSourceGlbSha256 !== "string" ||
       loadedSourceGlbSha256.toLowerCase() !== sourceGlbSha256.toLowerCase())) {
    throw new Error("The correction does not match the loaded source GLB hash.");
  }
  requireAttribute(position, "position", vertexCount);
  requireAttribute(normal, "normal", vertexCount);
  if (position.normalized || normal.normalized) {
    throw new TypeError("POSITION and NORMAL must not be normalized integer attributes.");
  }

  const indices = correction.indices;
  if (!Array.isArray(indices) && !ArrayBuffer.isView(indices)) {
    throw new TypeError("indices must be an array of vertex indices.");
  }
  const rows = Array.from(indices);
  if (new Set(rows).size !== rows.length ||
      rows.some(row => !Number.isInteger(row) || row < 0 || row >= vertexCount)) {
    throw new RangeError("indices must be unique integers within vertexCount.");
  }
  const count = rows.length * 3;
  requireFiniteArray(correction.deltaPosition, "deltaPosition", count);
  requireFiniteArray(correction.correctedNormal, "correctedNormal", count);

  // Copies isolate the active adapter from later mutations of its JSON input.
  const delta = Float64Array.from(correction.deltaPosition);
  const corrected = Float64Array.from(correction.correctedNormal);
  const basePosition = new Float64Array(count);
  const baseNormal = new Float64Array(count);
  const baseUnitNormal = new Float64Array(count);
  for (let k = 0; k < rows.length; k++) {
    const row = rows[k];
    const offset = k * 3;
    const p = [position.getX(row), position.getY(row), position.getZ(row)];
    const n = [normal.getX(row), normal.getY(row), normal.getZ(row)];
    if (![...p, ...n].every(Number.isFinite)) {
      throw new TypeError(`Source row ${row} contains non-finite values.`);
    }
    for (let c = 0; c < 3; c++) {
      if (!Number.isFinite(Math.fround(p[c])) ||
          !Number.isFinite(Math.fround(p[c] + delta[offset + c]))) {
        throw new RangeError(`Position correction exceeds the glTF float32 range at row ${row}.`);
      }
    }
    basePosition.set(p, offset);
    baseNormal.set(n, offset);
    baseUnitNormal.set(unitVector(...n, row), offset);
    corrected.set(unitVector(
      corrected[offset], corrected[offset + 1], corrected[offset + 2], row,
    ), offset);
  }

  let weight = 0;
  function apply(nextWeight) {
    if (typeof nextWeight !== "number" || !Number.isFinite(nextWeight) ||
        nextWeight < 0 || nextWeight > 1) {
      throw new RangeError("weight must be a finite number between 0 and 1.");
    }
    for (let k = 0; k < rows.length; k++) {
      const row = rows[k];
      const o = k * 3;
      if (nextWeight === 0) {
        // Preserve source float values, including signed zero. Do not normalize
        // the reset value or route it through interpolation arithmetic.
        position.setXYZ(row, basePosition[o], basePosition[o + 1], basePosition[o + 2]);
        normal.setXYZ(row, baseNormal[o], baseNormal[o + 1], baseNormal[o + 2]);
        continue;
      }
      position.setXYZ(row,
        basePosition[o] + nextWeight * delta[o],
        basePosition[o + 1] + nextWeight * delta[o + 1],
        basePosition[o + 2] + nextWeight * delta[o + 2]);
      const a = 1 - nextWeight;
      let x = a * baseUnitNormal[o] + nextWeight * corrected[o];
      let y = a * baseUnitNormal[o + 1] + nextWeight * corrected[o + 1];
      let z = a * baseUnitNormal[o + 2] + nextWeight * corrected[o + 2];
      const mixedLength = Math.hypot(x, y, z);
      if (mixedLength < 1e-12) {
        // Opposed normals have no unique normalized midpoint. Keep a finite,
        // deterministic direction; this does not certify that geometry safe.
        x = corrected[o]; y = corrected[o + 1]; z = corrected[o + 2];
      } else {
        x /= mixedLength; y /= mixedLength; z /= mixedLength;
      }
      normal.setXYZ(row, x, y, z);
    }
    if (rows.length) {
      position.needsUpdate = true;
      normal.needsUpdate = true;
    }
    weight = nextWeight;
  }

  return Object.freeze({
    apply,
    reset: () => apply(0),
    get weight() { return weight; },
    vertexCount,
    changedRowCount: rows.length,
    sourceGlbSha256,
    sourceHashVerified: loadedSourceGlbSha256 !== undefined,
  });
}
