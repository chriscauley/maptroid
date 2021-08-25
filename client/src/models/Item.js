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

const packs = ['missile', 'super-missile', 'power-bomb', 'energy-tank', 'reserve-tank']

const beams = ['charge-beam', 'ice-beam', 'wave-beam', 'spazer', 'plasma-beam']

const misc = ['pedastool', 'energy2-tank']

const all = [...abilities, ...packs, ...beams, ...misc]

const schema = {}

export default { all, abilities, packs, beams, misc }
