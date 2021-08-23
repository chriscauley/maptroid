const abilities = [
  'varia-suit',
  'gravity-suit',
  'x-ray',
  'grappling-hook',
  'morph-ball',
  'bomb',
  'spring-ball',
  'high-jump',
  'speed-booster',
  'space-jump',
  'screw-attack',
]

const packs = [
  'missle',
  'super-missle',
  'power-bomb',
  'energy-tank',
  // 'energy2-tank',
  'reserve-tank',
]

const beams = ['charge-beam', 'ice-beam', 'wave-beam', 'spazer', 'plasma-beam']

const bosses = [
  'ridley',
  'phantoon',
  'kraid',
  'draygon',
  // 'mother-brain',
]

const tiles = ['pedastool']

const all = [...bosses, ...abilities, ...packs, ...beams, ...tiles]

export default { all, bosses, abilities, packs, beams, tiles }
