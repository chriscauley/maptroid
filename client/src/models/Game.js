import Room from './Room'

class Game {
  // constructor(options) {
  //   this.options = options
  //   Object.assign(this, {
  //     state: {
  //       items: {},
  //       screens: {},
  //       rooms: {},
  //     },
  //   })
  // }
  populate({ _world, items, rooms }) {
    const cache = {
      room_by_id: {},
      room_by_xy: {},
      items_by_xy: {},
      items_by_room_id: {},
      items_by_type: {},
    }
    rooms.forEach((room) => {
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

    const _add = (subcache, key, obj) => {
      if (!subcache[key]) {
        subcache[key] = []
      }
      subcache[key].push(obj)
    }

    items.forEach((item) => {
      _add(cache.items_by_room_id, item.room_id, item)
      _add(cache.items_by_xy, item.world_xy, item)
      _add(cache.items_by_type, item.type, item)
      cache.items_by_xy[item.world_xy].push(item)
      const room = cache.room_by_id[item.room_id]
      if (!room || !Room.containsXY(room, item.world_xy)) {
        console.warn('item:', item)
        console.warn('room:', room)
        throw 'Room xy and item world_xy does not match'
      }
    })

    Object.assign(this, {
      getItemsbyXY: (xy) => cache.items_by_xy[xy],
      getItemsByRoomId: (id) => cache.items_by_room_id[id],
      getItemsByType: (type) => cache.items_by_type[type],
      getRoomByXY: (xy) => cache.room_by_xy[xy],
    })
  }
}

export default Game
