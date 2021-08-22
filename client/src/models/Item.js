const abilities = [
  'morph-ball',
  'bomb',
  'screw-attack',
  'space-jump',
  'high-jump',
  'speed-booster',
  'spring-ball',
  'varia-suit',
  'gravity-suit',
]

const packs = [
  'missle',
  'super-missle',
  'power-bomb',
  'energy-tank',
  // 'energy2-tank',
  'reserve-tank',
]

const beams = [
  'charge-beam',
  'spazer',
  'wave-beam',
  'ice-beam',
  'plasma-beam',
  'x-ray',
  'grappling-hook',
]

const tiles = ['pedastool']

const all = [...abilities, ...packs, ...beams, ...tiles]

export default { all, abilities, packs, beams, tiles }
