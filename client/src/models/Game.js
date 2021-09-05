import Room from './Room'
import vec from '@/lib/vec'
import mitt from 'mitt'

class Game {
  constructor({ playthrough }) {
    const { on, off, emit } = mitt()
    const state = {
      items: {},
      missing: {},
      screens: {},
      rooms: {},
      actions: [],
      xys: [],
      xy: null,
    }

    Object.assign(this, { on, off, emit, state, playthrough })
  }
  populate({ _world, items, rooms }) {
    const cache = {
      room_by_id: {},
      room_by_xy: {},
      item_by_id: {},
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
      cache.item_by_id[item.id] = item
      _add(cache.items_by_room_id, item.room_id, item)
      _add(cache.items_by_xy, item.world_xy, item)
      _add(cache.items_by_type, item.type, item)
      const room = cache.room_by_id[item.room_id]
      if (room && !Room.containsXY(room, item.world_xy)) {
        console.warn('item:', item)
        console.warn('room:', room)
        throw 'Room xy and item world_xy does not match!!'
      }
    })

    Object.assign(this, {
      getItemsbyXY: (xy) => cache.items_by_xy[xy] || [],
      getItemsByRoomId: (id) => cache.items_by_room_id[id] || [],
      getItemsByType: (type) => cache.items_by_type[type] || [],
      getRoomByXY: (xy) => cache.room_by_xy[xy],
      listItems: () => items.filter((i) => this.state.items[i.id]),
      listMissingItems: () => items.filter((i) => !this.state.items[i.id]),
    })
  }
  start() {
    // TODO use wordl.start_xy instead of item.type === 'ship'
    const { actions } = this.playthrough
    if (actions.length) {
      this.playthrough.actions = [] // reset actions to avoid duplicates during replay
      actions.forEach(([action, ...args]) => this[action](...args))
    } else {
      const ship = this.getItemsByType('ship')?.[0]
      this.goto([...ship.world_xy])
    }
  }
  move(direction) {
    this.goto(vec.add(this.state.xy, vec.dxyByName[direction]))
  }
  getItem(item_id) {
    this.playthrough.actions.push(['getItem', item_id])
    if (this.state.missing[item_id]) {
      delete this.state.missing[item_id]
    } else if (this.state.items[item_id]) {
      this.state.missing[item_id] = true
      delete this.state.items[item_id]
    } else {
      this.state.items[item_id] = true
    }
  }
  undo(i = 1) {
    while (i--) {
      const action = this.playthrough.actions.pop()
      if (action[0] === 'goto') {
        this.state.xys.pop()
        this.goto(this.state.xys.pop())
        this.playthrough.actions.pop() // remove extra action made by previous line
      } else if (action[0] === 'getItem') {
        delete this.state.items[action[1]]
      }
    }
  }
  goto(xy) {
    const new_room = this.getRoomByXY(xy)
    if (!new_room) {
      return
    }
    this.playthrough.actions.push(['goto', xy])
    this.state.xys.push(xy)
    this.state.xy = xy
    if (new_room !== this.state.room) {
      this.state.room = new_room
      this.emit('goto-room', new_room)
    }
  }
  getArrows() {
    let last_xy = this.state.xys[0]
    const raw_arrows = this.state.xys.slice(1).map((xy) => {
      const [x1, y1] = last_xy
      const [x2, y2] = xy
      last_xy = xy
      const arrow = { x1, y1, x2, y2 }

      // arrows should start and end from center of box
      arrow.x1 += 0.5
      arrow.x2 += 0.5
      arrow.y1 += 0.5
      arrow.y2 += 0.5
      if (x1 === x2) {
        arrow.direction = y1 > y2 ? 'up' : 'down'
        arrow.orientation = 'y'
      } else {
        arrow.direction = x1 > x2 ? 'left' : 'right'
        arrow.orientation = 'x'
      }
      arrow['marker-end'] = `url(#arrowhead-${arrow.direction})`
      arrow._slug = [x1, y1 + '|' + x2, y2].join(',')
      return arrow
    })
    const combined_arrows = []
    let current_arrow = {}
    raw_arrows.forEach((raw_arrow) => {
      if (raw_arrow.direction !== current_arrow.direction) {
        current_arrow = {
          ...raw_arrow,
          length: 1,
        }
        if (current_arrow.orientation === 'x') {
          const offset = current_arrow.direction === 'right' ? 0.1 : -0.1
          current_arrow.y1 += offset
          current_arrow.y2 += offset
        } else {
          const offset = current_arrow.direction === 'up' ? 0.1 : -0.1
          current_arrow.x1 += offset
          current_arrow.x2 += offset
        }
        combined_arrows.push(current_arrow)
      } else {
        // continue current arrow in direction
        current_arrow.length += 1
        if (current_arrow.orientation === 'x') {
          current_arrow.x2 = raw_arrow.x2
        } else {
          current_arrow.y2 = raw_arrow.y2
        }
      }
    })
    return combined_arrows
  }
}

export default Game
