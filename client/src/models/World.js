import Geo from '@unrest/geo'
import mitt from 'mitt'

const MITT_EVENTS = ['gotoIndex', 'gotoRoom']

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    dzi: { type: 'string' },
    W: { type: 'integer' },
    H: { type: 'integer' },
  },
}

class World {
  constructor(options) {
    this.options = options
    const { W, H, name, dzi, id } = this.options
    Object.assign(this, { W, H, name, dzi, id })
    this.geo = new Geo(W, H)
    this.room_geo = new Geo(16, 16)

    const { on, off } = (this.mitt = mitt())
    Object.assign(this, { on, off, MITT_EVENTS })
  }
  toJson() {
    const data = { id: this.id }
    Object.keys(schema.properties).forEach((key) => (data[key] = this[key]))
    return data
  }
  populate({ items, rooms }) {
    const cache = (this.cache = {
      items,
      rooms,
      room_by_id: {},
      room_by_index: {},
      items_by_index: {},
      items_by_room_id: {},
    })
    rooms.forEach((room) => {
      room.xys.forEach((xy) => {
        const index = this.geo.xy2index(xy)
        if (cache.room_by_index[index]) {
          console.warn('old room:', cache.room_by_index[index])
          console.warn('new_room:', room)
          throw 'Index already occupied by room.'
        }
        cache.room_by_index[index] = room
      })
      cache.room_by_id[room.id] = room
    })
    items.forEach((item) => {
      cache.items_by_room_id[item.room_id] = cache.items_by_room_id[item.room_id] || []
      cache.items_by_room_id[item.room_id].push(item)
      cache.items_by_index[item.world_index] = cache.items_by_index[item.world_index] || []
      cache.items_by_index[item.world_index].push(item)
      const room = cache.room_by_id[item.room_id]
      if (!room?.indexes.includes(item.world_index)) {
        console.warn('item:', item)
        console.warn('room:', room)
        throw 'Room index and item world_index does not match'
      }
    })

    this.reset()
  }

  reset() {
    // TODO this should be a play model that tracks user moves
    this.playthrough = {
      world_index: null,
      room: null,
      items: {},
      indexes: {},
      actions: [],
    }
    this.gotoIndex(this.cache.items.find((i) => i.type === 'ship').world_index)
  }

  gotoIndex(index) {
    this.playthrough.actions.push(['gotoIn', index])
    this.playthrough.world_index = index
    const room = this.cache.room_by_index[index]
    if (room !== this.playthrough.room) {
      this.playthrough.room = room
      this.mitt.emit('gotoRoom', room)
    }
    this.mitt.emit('gotoIndex', index)
  }
}

export default World
