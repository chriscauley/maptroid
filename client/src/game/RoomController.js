import { cloneDeep } from 'lodash'
import { vec2 } from 'p2'
import { vector, mod } from '@unrest/geo'

import Room from '@/models/Room'
import Brick from './Brick'
import { SCENERY_GROUP, BULLET_GROUP, PLAYER_GROUP } from './constants'

const _yflip = (xy) => [xy[0], -xy[1]] // YFLIP

const invertDoor = ([x, y, orientation, color]) => {
  if (['left', 'right'].includes(orientation)) {
    // yflip - have to flip door by subtracting height from y
    return { x, y: y - 4, orientation, color, width: 1, height: 4 }
  }
  return { x, y, orientation, color, width: 4, height: 1 }
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
  const bricks = Room.getGroupedBlocks(json)
    .filter((b) => !b.type.endsWith('-exit'))
    .map((b) => {
      b.type = b.type.split(' -').pop()
      b.y = -b.y
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
    bricks,
  }
  return data
}

// DEPRECATED this is an old way to load rooms from string. Might be useful in tests
export const fromString = (string, options = {}) => {
  options = cloneDeep(options)
  options.json = {
    bricks: [],
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
        options.json.bricks.push({ x, y, type: 'moss' })
      } else if (s === ' ' || s === '_') {
        return
      } else {
        throw 'Unrecognized brick: ' + s
      }
    })
  })

  return new RoomController(options)
}

export default class RoomController {
  constructor(json, world_controller) {
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
        const exterior = [
          [x, y],
          [x + 2, y],
          [x + 2, y - 0.5],
          [x, y - 0.5],
        ]
        this.static_shapes.push({
          color: 'red',
          exterior: exterior.map((xy) => [xy[0] / 16, xy[1] / 16]).map(this._room2world),
          type,
        })
      } else if (type === 'ship') {
        const exterior = [
          [x + 5, y - 0.5],
          [x + 7, y - 0.5],
          [x + 7, y - 1],
          [x + 5, y - 1],
        ]
        this.static_shapes.push({
          color: 'red',
          exterior: exterior.map((xy) => [xy[0] / 16, xy[1] / 16]).map(this._room2world),
          type,
        })
      }
    }
  }

  _room2world = (xy) => vector.times(vector.add(xy, this.world_xy0), 16)
  _addEdges() {
    const [room_x, room_y] = this.world_xy0
    this.edges = []
    this.data.exit.forEach(({ x, y, width, height }) => {
      let target_dxy
      if (mod(x, 16) === 15) {
        x -= 3
        width += 3
        target_dxy = [1, 0]
      } else if (mod(x, 16) === 0) {
        width += 3
        target_dxy = [-1, 0]
      } else if (mod(y, 16) === 15) {
        y -= 3
        height += 3
        target_dxy = [0, 1]
      } else if (mod(y, 16) === 0) {
        height += 3
        target_dxy = [0, -1]
      } else {
        console.warn('cannot place exit', x, y, width, height)
        return
      }
      const edge_x = 16 * room_x + x
      const edge_y = 16 * room_y + y
      const center_x = edge_x + width / 2
      const center_y = edge_y + height / 2
      const options = { _color: 'rgba(255, 128, 128, 0.5)', collisionResponse: false }
      const body = this.game.addStaticBox([center_x, center_y, width, height], options)
      this.bodies.push(body)
      const screen_xy = vector.add(this.world_xy0, [parseInt(x / 16), parseInt(y / 16)])
      if (target_dxy[1] === -1) {
        // Issue #182000795
        screen_xy[1]++
      }
      body._target_xy = vector.add(screen_xy, target_dxy)
      this.edges.push(body)
    })
  }

  _addBodies() {
    this.bodies = []

    // TODO populate bricks from json
    // Add bricks
    this.data.bricks.forEach(({ x, y, width, height, type }) => {
      x += this.world_xy0[0] * 16 + width / 2
      y += this.world_xy0[1] * 16 - height / 2
      const brick = new Brick({ game: this.game, x, y, width, height, type })
      this.bodies.push(brick.body)
    })

    const collisionMask = PLAYER_GROUP | BULLET_GROUP
    const shape_options = { collisionMask, collisionGroup: SCENERY_GROUP }
    // Add bts shapes
    this.static_shapes.forEach((shape) => {
      shape_options._color = shape.color
      shape_options._type = shape.type
      this.bodies.push(this.game.addStaticShape(shape.exterior, shape_options))
    })
  }

  bindGame(game) {
    if (this.game) {
      return
    }
    game.active_rooms.push(this)
    this.game = game
    this._addBodies()
    this._addEdges()
  }

  positionPlayer(player) {
    const setPosition = (room_xy, offset) => {
      room_xy = vector.add(room_xy, offset)
      player.body.position = vector.add(vector.times(this.world_xy0, 16), room_xy)
      player.body.updateAABB()
    }
    for (let { x, y, type } of this.data.plm_overrides) {
      if (type === 'ship') {
        return setPosition([x, y], [6, 1])
      }
      if (type === 'save-station') {
        return setPosition([x, y], [1, 1.5])
      }
    }
    const { entrance_number } = player.state
    let edge = this.edges.find((e) => e._entrance_number == entrance_number)
    if (!edge) {
      edge = this.edges[0]
    }
    return (player.body.position = vec2.clone(edge.position))
  }
}
