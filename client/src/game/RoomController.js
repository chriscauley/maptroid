import { cloneDeep } from 'lodash'
import { vec2 } from 'p2'
import { vector } from '@unrest/geo'

import Room from '@/models/Room'
import BlockEntity from './entities/BlockEntity'
import DoorEntity from './entities/DoorEntity'
import ItemEntity from './entities/ItemEntity'
import { GROUP } from './constants'
import Exit from './region/Exit'
import { invertAsset } from './useAssets'

const _yflip = (xy) => [xy[0], -xy[1]] // YFLIP

const invertDoor = ([x, y, orientation, color]) => {
  if (orientation === 'left') {
    return { x: x, y: -y, orientation, color, width: 0.5, height: 4 }
  } else if (orientation === 'right') {
    return { x: x + 0.5, y: -y, orientation, color, width: 0.5, height: 4 }
  } else if (orientation === 'down') {
    return { x, y: -y - 0.5, orientation, color, width: 4, height: 0.5 }
  }
  return { x, y: -y, orientation, color, width: 4, height: 0.5 }
}

const invertBounds = ([x, y, width, height]) => {
  return { x, y: -y - height, width, height }
}

const invertXyMap = (object) => {
  return Object.entries(object).map(([sxy, type]) => {
    const [x, y] = sxy.split(',').map(Number)
    return { x, y: -y, type }
  })
}

const invertJson = (json) => {
  const blocks = Room.getGroupedBlocks(json)
    .filter((b) => !b.type.endsWith('-exit') && !b.type.endsWith('-empty'))
    .map((b) => {
      b.regrow = b.type.includes('-respawn') ? 50 : null
      b.type = b.type.split(' -').pop()
      b.y = -b.y // y-flip
      return b
    })
  const data = {
    doors: json.data.doors.map(invertDoor),
    exit: json.data.cre_hex.exit.map(invertBounds),
    screens: json.data.geometry.screens.map(_yflip),
    geometry: {
      inner: json.data.geometry.inner.map((geo) => {
        if (geo.interiors?.length) {
          // TODO there are examples of this in the aquaduct. Do they ever matter?
        }
        return { exterior: geo.exterior.map(_yflip) }
      }),
    },
    plm_overrides: invertXyMap(json.data.plm_overrides || {}),
    blocks,
  }
  return data
}

const invertItems = (room) => {
  const items = room.game.items_by_room_id[room.id] || []
  const [room_x, room_y] = room.world_xy0
  return items.map(({ data, id: item_id }) => {
    const { room_xy, modifier, type } = data
    const x = room_xy[0] + room_x * 16 + 0.5
    const y = -room_xy[1] + room_y * 16 - 0.5 // yflip
    return { x, y, width: 1, height: 1, modifier, type, item_id, room }
  })
}

// DEPRECATED this is an old way to load rooms from string. Might be useful in tests
export const fromString = (string, options = {}) => {
  options = cloneDeep(options)
  options.json = {
    blocks: [],
    static_boxes: [],
    screens: [],
  }
  const rows = string.trim().split('\n')
  rows.forEach((row, y) => {
    y = -y
    row.split('').forEach((s, x) => {
      if (s === 'S') {
        options.json.start = [x, y]
      } else if (s === '0') {
        options.json.static_boxes.push({ x, y, width: 1, height: 1 })
      } else if (s === '1') {
        options.json.blocks.push({ x, y, type: 'moss' })
      } else if (s === ' ' || s === '_') {
        return
      } else {
        throw 'Unrecognized block: ' + s
      }
    })
  })

  return new RoomController(options)
}

export default class RoomController {
  constructor(json, world_controller) {
    this.fg_canvas = document.createElement('canvas')
    this.json = json
    this.data = invertJson(json)
    this.id = this.json.id
    this.world_controller = world_controller

    this.world_xy0 = this.world_controller.xy0_by_room_id[this.json.id]
    const screen_xys = this.data.screens.map((room_xy) => vector.add(room_xy, this.world_xy0))

    // TODO this used to be used to figure out exits
    this.screens = screen_xys.map((world_xy) => ({ world_xy }))

    this.static_shapes = []
    const _xy16 = [16 * this.world_xy0[0], 16 * this.world_xy0[1]]
    this.data.geometry.inner.forEach((geo) => {
      // TODO see comment in invert json about geo.inner
      this.static_shapes.push({
        exterior: geo.exterior.map(this._room2world),
      })
    })
    for (let { x, y, type } of this.data.plm_overrides) {
      if (type === 'save-station') {
        this.save_station = true
        const exterior = [
          [x, y],
          [x + 2, y],
          [x + 2, y - 0.5],
          [x, y - 0.5],
        ]
        const onCrouch = () => this.game.save()
        this.static_shapes.push({
          exterior: exterior.map((xy) => [xy[0] / 16, xy[1] / 16]).map(this._room2world),
          _entity: { type, color: 'red', room: this, onCrouch },
        })
      } else if (type === 'ship') {
        this.save_station = true
        const onCrouch = () => this.game.save()
        const exterior = [
          [x + 5, y - 0.5],
          [x + 7, y - 0.5],
          [x + 7, y - 1],
          [x + 5, y - 1],
        ]
        const draw = (ctx) => {
          const img = invertAsset('ship')
          const dh = 5
          const dw = 11.75
          ctx.save()
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(img, -dw / 2, -4, dw, dh)
          ctx.restore()
        }
        this.static_shapes.push({
          exterior: exterior.map((xy) => [xy[0] / 16, xy[1] / 16]).map(this._room2world),
          _entity: { type, color: 'red', room: this, onCrouch, draw },
        })
      } else if (type === 'elevator') {
        const exterior = [
          [x, y],
          [x + 2, y],
          [x + 2, y - 0.5],
          [x, y - 0.5],
        ]
        const screen_xy = vector.add([x / 16, y / 16], this.world_xy0).map((i) => Math.floor(i))
        screen_xy[1]++ // TODO why this ++?
        this.static_shapes.push({
          exterior: exterior.map((xy) => [xy[0] / 16, xy[1] / 16]).map(this._room2world),
          _entity: {
            room: this,
            color: 'yellow',
            type,
            room_xy: [x, y],
            draw: (ctx) => {
              const img = invertAsset('platform')
              ctx.drawImage(img, 0, 0, 32, 5, -1, 0, 2, 0.25)
            },
            onCrouch: () => {
              const elevators = this.world_controller.elevators[screen_xy]
              let warped
              elevators.forEach(([target_xy, dxy]) => {
                if (dxy[1] && !dxy[0]) {
                  if (warped) {
                    throw 'Attempting to warp twice!'
                  }
                  this.game.warp(this.world_controller.room_map[target_xy].id)
                  warped = true
                }
              })
            },
          },
        })
      }
    }
  }

  _room2world = (xy) => vector.times(vector.add(xy, this.world_xy0), 16)
  _addExits() {
    this.exits = []
    this.data.exit.forEach(({ x, y, width, height }) => {
      this.exits.push(new Exit({ x, y, width, height, room: this }))
    })
  }

  _addBodies() {
    this.bodies = []

    // TODO populate blocks from json
    // Add blocks
    this.data.blocks.forEach(({ x, y, width, height, type, regrow }) => {
      x += this.world_xy0[0] * 16 + width / 2
      y += this.world_xy0[1] * 16 - height / 2
      const block = new BlockEntity({ x, y, width, height, type, room: this, regrow })
      this.bodies.push(block.body)
    })

    const collisionMask = GROUP.player | GROUP.bullet
    // Add bts shapes
    this.static_shapes.forEach((shape) => {
      const options = {
        collisionMask,
        collisionGroup: GROUP.scenery,
        ...shape,
      }
      this.bodies.push(this.game.addStaticShape(shape.exterior, options))
    })
  }

  _resetDoors() {
    this.doors = []
    this.data.doors.forEach(({ x, y, width, height, color, orientation }) => {
      x += this.world_xy0[0] * 16 + width / 2
      y += this.world_xy0[1] * 16 - height / 2
      const door = new DoorEntity({
        room: this,
        x,
        y,
        width,
        height,
        type: 'door',
        orientation,
        color,
      })
      this.bodies.push(door.body)
      this.doors.push(door)
    })
  }

  _addItems() {
    this.items = invertItems(this).map((i) => new ItemEntity(i))
  }

  bindGame(game) {
    if (this.game) {
      return
    }
    this.img = document.createElement('img')
    this.img.src = `/media/sm_cache/${this.world_controller.slug}/layer-1/${this.json.key}`
    this.img.onload = this.resetCanvas

    game.active_rooms.push(this)
    this.game = game
    this.regions = []
    this._addBodies()
    this._addExits()
    this._resetDoors()
    this._addItems()
  }

  positionPlayer(player) {
    player.enterRoom(this)
    const setPosition = (room_xy, offset) => {
      room_xy = vector.add(room_xy, offset)
      player.body.position = vector.add(vector.times(this.world_xy0, 16), room_xy)
      player.body.updateAABB()
      this.game.syncCamera()
    }
    for (let { x, y, type } of this.data.plm_overrides) {
      if (type === 'ship') {
        setPosition([x, y], [6, 1])
        return
      }
      if (type === 'save-station' || type === 'elevator') {
        setPosition([x, y], [1, 1.5])
        return
      }
    }
    const { entrance_number } = player.save_state
    let exit = this.exits.find((e) => e.options.entrance_number == entrance_number)
    if (!exit) {
      exit = this.exits[0]
    }
    player.body.position = vec2.clone(exit.body.position)
    const p = player.body.position
    vec2.add(p, p, exit.start_position)
    this.game.syncCamera()
    return
  }

  resetCanvas = () => {
    this.fg_canvas.width = this.img.width
    this.fg_canvas.height = this.img.height
    const ctx = this.fg_canvas.getContext('2d')
    ctx.drawImage(this.img, 0, 0)
    this.data.doors.forEach(({ x, y, width, height }) =>
      ctx.clearRect(x * 16, y * -16, 16 * width, 16 * height),
    )
  }

  drawOnFg(img, { width, height, x, y }, source_bounds) {
    const ctx = this.fg_canvas.getContext('2d')
    x = x - this.world_xy0[0] * 16 - width / 2
    y = -(y - this.world_xy0[1] * 16 + height - height / 2) // yflip
    const bounds = [16 * x, 16 * y, 16 * width, 16 * height]
    // TODO store this in order to possibly draw it later
    ctx.clearRect(...bounds)
    if (img) {
      if (source_bounds) {
        ctx.drawImage(img, ...source_bounds, ...bounds)
      } else {
        ctx.drawImage(img, bounds[0], bounds[1])
      }
    }
  }
}
