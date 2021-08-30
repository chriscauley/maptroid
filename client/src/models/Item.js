import fields from './fields'

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
  getMapBounds(item, _world) {
    // TODO 256 and 16 should be on world, not constants
    const [world_x, world_y] = item.world_xy
    const [screen_x, screen_y] = item.screen_xy
    return {
      x: world_x * 256 + screen_x * 16,
      y: world_y * 256 + screen_y * 16,
      width: item.width * 16,
      height: item.height * 16,
    }
  },
  all,
  abilities,
  packs,
  beams,
  misc,
}
