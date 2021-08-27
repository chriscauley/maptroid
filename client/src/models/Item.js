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

export default {
  all,
  abilities,
  packs,
  beams,
  misc,
  getMapBounds(item, world) {
    const { world_index, room_index, width, height } = item
    const [world_x, world_y] = world.geo.index2xy(world_index)
    const [room_x, room_y] = world.room_geo.index2xy(room_index)
    return {
      x: world_x * 256 + room_x * 16,
      y: world_y * 256 + room_y * 16,
      width: width * 16,
      height: height * 16,
    }
  },
}
