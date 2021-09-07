const abilities = [
  'varia-suit',
  'gravity-suit',
  'morph-ball',
  'bomb',
  'spring-ball',
  'high-jump',
  'speed-booster',
  'space-jump',
  'screw-attack',
]

const packs = ['missile', 'super-missile', 'power-bomb', 'energy-tank', 'reserve-tank']

const beams = [
  'charge-beam',
  'ice-beam',
  'wave-beam',
  'spazer',
  'plasma-beam',
  'x-ray',
  'grappling-hook',
]

const misc = ['pedastool', 'energy2-tank']

const all = [...abilities, ...packs, ...beams, ...misc]

const _schema = {
  type: 'object',
  properties: {
    type: { type: 'string' },
    class: { type: 'string' },
    width: { type: 'number' },
    height: { type: 'number' },
    world_xy: fields.xy,
    screen_xy: fields.xy,
    room_id: { type: 'number' },
  },
}

export default {
  _schema,
  getMapBounds(item, world) {
    const [world_x, world_y] = item.world_xy
    const [screen_x, screen_y] = item.screen_xy
    const { map_screen_size, map_item_size } = world
    return {
      x: world_x * map_screen_size + screen_x * map_item_size,
      y: world_y * map_screen_size + screen_y * map_item_size,
      width: item.width * map_item_size,
      height: item.height * map_item_size,
    }
  },
  all,
  abilities,
  packs,
  beams,
  misc,
}
