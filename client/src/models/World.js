import mitt from 'mitt'

import Model from './Model'
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

class World extends Model {
  constructor(options) {
    super(options, schema)

    const { on, off } = (this.mitt = mitt())
    Object.assign(this, { on, off, MITT_EVENTS })
  }
  populate({ items, rooms }) {
    const cache = {
      room_by_id: {},
      room_by_xy: {},
      items_by_xy: {},
      items_by_room_id: {},
    }
    Object.assign(this, { items, rooms, cache })
    rooms.forEach((room) => {
      room.world = this
      room.xys.forEach((xy) => {
        if (cache.room_by_xy[xy]) {
          console.warn('old room:', cache.room_by_xy[xy])
          console.warn('new_room:', room)
          throw 'XY already occupied by room.'
        }
        cache.room_by_xy[xy] = room
      })
      cache.room_by_id[room.id] = room
    })
    items.forEach((item) => {
      item.world = this
      cache.items_by_room_id[item.room_id] = cache.items_by_room_id[item.room_id] || []
      cache.items_by_room_id[item.room_id].push(item)
      cache.items_by_xy[item.world_xy] = cache.items_by_xy[item.world_xy] || []
      cache.items_by_xy[item.world_xy].push(item)
      const room = cache.room_by_id[item.room_id]
      if (!room?.containsXY(item.world_xy)) {
        console.warn('item:', item)
        console.warn('room:', room)
        throw 'Room xy and item world_xy does not match'
      }
    })

    this.reset()
  }

  reset() {
    // TODO this should be a play model that tracks user moves
    this.playthrough = {
      world_xy: null,
      room: null,
      items: {},
      xys: {},
      actions: [],
    }
    this.goto(this.items.find((i) => i.type === 'ship').world_xy)
  }

  goto(xy) {
    this.playthrough.actions.push(['gotoIn', xy])
    this.playthrough.world_xy = xy
    const room = this.cache.room_by_xy[xy]
    if (room !== this.playthrough.room) {
      this.playthrough.room = room
      this.mitt.emit('gotoRoom', room)
    }
    this.mitt.emit('goto', xy)
  }
}

export default World
