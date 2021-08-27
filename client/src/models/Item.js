import Model from './Model'
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

const schema = {
  type: 'object',
  properties: {
    xys: fields.xy,
    name: { type: 'string' },
    type: { type: 'string' },
    class: { type: 'string' },
    width: { type: 'number' },
    height: { type: 'number' },
    world_xy: fields.xy,
    screen_xy: fields.xy,
    room_id: { type: 'number' },
  },
}

class Item extends Model {
  constructor(options) {
    if (options.x) {
      const { x, y } = options
      options.world_xy = [Math.floor(x / 256), Math.floor(y / 256)]
      options.screen_xy = [(x % 256) / 16, (y % 256) / 16]
    }
    super(options, schema)
  }
  getMapBounds() {
    const [world_x, world_y] = this.world_xy
    const [screen_x, screen_y] = this.screen_xy
    return {
      x: world_x * 256 + screen_x * 16,
      y: world_y * 256 + screen_y * 16,
      width: this.width * 16,
      height: this.height * 16,
    }
  }
}

Object.assign(Item, {
  all,
  abilities,
  packs,
  beams,
  misc,
})

export default Item
