/**
 * Deterministic PRNG for IBVAP-SIM
 *
 * Mulberry32 implementation provides reproducible floating point generation
 * matching seed determinism requirements.
 */

export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    // 32-bit unsigned initialization
    this.state = (Math.floor(seed) >>> 0) || 1001;
  }

  /**
   * Generates a deterministic float in [0.0, 1.0).
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generates a deterministic float in [min, max).
   */
  uniform(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  /**
   * Generates a deterministic integer in [min, max].
   */
  randint(min: number, max: number): number {
    return Math.floor(this.uniform(min, max + 1));
  }
}

/**
 * Deterministic UUID generator from seed.
 */
export function generateDeterministicUuid(seed: number): string {
  const rng = new SeededRNG(seed);
  const hexChars = "0123456789abcdef";
  let uuid = "";
  for (let i = 0; i < 32; i++) {
    if (i === 8 || i === 12 || i === 16 || i === 20) {
      uuid += "-";
    }
    if (i === 12) {
      uuid += "4"; // UUID v4 flag
    } else if (i === 16) {
      uuid += hexChars[(Math.floor(rng.uniform(0, 16)) & 0x3) | 0x8];
    } else {
      uuid += hexChars[Math.floor(rng.uniform(0, 16))];
    }
  }
  return uuid;
}

export function generateRandomUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "sim-" + Math.random().toString(36).substring(2, 15) + "-" + Date.now().toString(36);
}
