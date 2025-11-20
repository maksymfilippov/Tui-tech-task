export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickRandom<T>(items: T[]): T {
  if (!items.length) {
    throw new Error('Cannot pick random element from empty array');
  }
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}
