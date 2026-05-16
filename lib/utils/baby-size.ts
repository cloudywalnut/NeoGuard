const BABY_SIZES: Record<number, { name: string; emoji: string }> = {
  4: { name: 'poppy seed', emoji: '🌱' },
  6: { name: 'lentil', emoji: '🫘' },
  8: { name: 'raspberry', emoji: '🍇' },
  10: { name: 'strawberry', emoji: '🍓' },
  12: { name: 'lime', emoji: '🍋' },
  14: { name: 'lemon', emoji: '🍋' },
  16: { name: 'avocado', emoji: '🥑' },
  18: { name: 'sweet potato', emoji: '🍠' },
  20: { name: 'banana', emoji: '🍌' },
  22: { name: 'papaya', emoji: '🍈' },
  24: { name: 'corn cob', emoji: '🌽' },
  26: { name: 'lettuce head', emoji: '🥬' },
  28: { name: 'eggplant', emoji: '🍆' },
  30: { name: 'cabbage', emoji: '🥦' },
  32: { name: 'squash', emoji: '🎃' },
  34: { name: 'cantaloupe', emoji: '🍈' },
  36: { name: 'honeydew melon', emoji: '🍈' },
  38: { name: 'watermelon', emoji: '🍉' },
  40: { name: 'pumpkin', emoji: '🎃' },
}

export function getBabySize(weeks: number): { name: string; emoji: string } {
  const keys = Object.keys(BABY_SIZES).map(Number).sort((a, b) => a - b)
  let best = keys[0]
  for (const k of keys) {
    if (weeks >= k) best = k
  }
  return BABY_SIZES[best]
}
