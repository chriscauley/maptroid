import Model from './Model'
import fields from './fields'

const schema = {
  type: 'object',
  properties: {
    xys: fields.xy,
    name: { type: 'string' },
    area: { type: 'string' },
  },
}

export default class Room extends Model {
  constructor(options) {
    super(options, schema)
    this.set()
  }
  set(obj = {}) {
    Object.assign(this, obj)
    this._key_map = {}
    this._world_keys = this.xys.map((xy) => xy.toString())
    this.xys.forEach((xy) => (this._key_map[xy] = true))
  }
  containsXY(xy) {
    return this._key_map[xy]
  }
  getBounds() {
    const xs = this.xys.map((xy) => xy[0])
    const ys = this.xys.map((xy) => xy[1])
    const x1 = Math.min(...xs)
    const y1 = Math.min(...ys)
    const x2 = Math.max(...xs)
    const y2 = Math.max(...ys)
    return [x1, y1, x2 - x1 + 1, y2 - y1 + 1]
  }
  getMapBounds() {
    return this.getBounds().map((i) => i * 256)
  }
}
