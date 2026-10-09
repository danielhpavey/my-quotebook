const DAY_MS = 24 * 60 * 60 * 1000;

// small seeded random number generator (mulberry32), so the same seed always
// gives the same sequence and every build on a given day agrees
const seededRandom = seed => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Picks the quote for a given day (UTC). Quotes are shuffled into a random
// order that is worked through one per day, so every quote appears once before
// any repeats; each pass through the list uses a different shuffle.
export function quoteOfTheDay(posts, date = new Date()) {
  if (posts.length === 0) return null;

  const day = Math.floor(date.getTime() / DAY_MS);
  const cycle = Math.floor(day / posts.length);
  const random = seededRandom(cycle);

  // sort first so the shuffle doesn't depend on the order Airtable returns records
  const order = [...posts].sort((a, b) => a.id.localeCompare(b.id));
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  return order[day % posts.length];
}
