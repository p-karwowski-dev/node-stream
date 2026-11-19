export interface RandomStream {
  nextFloat(): number;
  nextInt(minInclusive: number, maxInclusive: number): number;
}

const hashOffset = 2166136261;
const hashPrime = 16777619;

function hashSeedAndName(seed: number, name: string): number {
  let hash = hashOffset;
  const text = `${seed}:${name}`;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, hashPrime);
  }
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 2246822507);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 3266489909);
  hash ^= hash >>> 16;
  return hash >>> 0;
}

export function createStream(seed: number, name: string): RandomStream {
  let state = hashSeedAndName(seed, name);

  function nextFloat(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(minInclusive: number, maxInclusive: number): number {
    return minInclusive + Math.floor(nextFloat() * (maxInclusive - minInclusive + 1));
  }

  return { nextFloat, nextInt };
}
