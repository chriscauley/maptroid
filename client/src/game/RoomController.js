import { cloneDeep } from 'lodash'
import { vector } from '@unrest/geo'

import Brick from './Brick'
import { SCENERY_GROUP, BULLET_GROUP, PLAYER_GROUP } from './constants'

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

  return new Room(options)
}

const _yflip = (xy) => [xy[0], -xy[1]] // YFLIP

export default class Room {
  constructor(json, world_controller) {
    this.json = json
    this.id = this.json.id
    this.world_controller = world_controller

    // YFLIP all coordinates and set the coordinates to world_coordinates
    this.world_xy0 = this.world_controller.xy0_by_room_id[this.json.id]
    const screen_xys = json.data.geometry.screens.map((room_xy) =>
      vector.add(_yflip(room_xy), this.world_xy0),
    )

    // TODO this used to be used to figure out exits
    this.screens = screen_xys.map((world_xy) => ({ world_xy }))

    this.static_shapes = []
    const _xy16 = [16 * this.world_xy0[0], 16 * this.world_xy0[1]]
    json.data.geometry.inner.forEach((geo) => {
      if (geo.interiors?.length) {
        // TODO there are examples of this in pink maridia. Do they ever matter?
      }
      const _transform = (xy) => vector.times(vector.add(_yflip(xy), this.world_xy0), 16)
      this.static_shapes.push({
        exterior: geo.exterior.map(_transform),
      })
    })
  }

  _addEdges() {
    const [room_x, room_y] = this.world_xy0
    this.edges = []
    this.json.data.cre_hex.exit.forEach(([x, y, width, height]) => {
      let target_dxy
      if (x % 16 === 15) {
        x -= 3
        width += 3
        target_dxy = [1, 0]
      } else if (x % 16 === 0) {
        width += 3
        target_dxy = [-1, 0]
      } else if (y % 16 === 0) {
        height += 3
        target_dxy = [0, 1]
      } else if (y % 16 === 15) {
        y -= 3
        height += 3
        target_dxy = [0, -1]
      } else {
        console.warn('cannot place exit', x, y, width, height)
        return
      }
      const edge_x = 16 * room_x + x
      const edge_y = 16 * room_y - y - height // yflip
      const center_x = edge_x + width / 2
      const center_y = edge_y + height / 2
      const options = { _color: 'rgba(255, 128, 128, 0.5)', collisionResponse: false }
      const body = this.game.addStaticBox([center_x, center_y, width, height], options)
      this.bodies.push(body)
      const screen_xy = vector.add(this.world_xy0, [parseInt(x / 16), parseInt(-y / 16)])
      body._target_xy = vector.add(screen_xy, target_dxy)
      this.edges.push(body)
    })
  }

  _addBodies() {
    this.bodies = []
    this.bricks = []

    // TODO populate bricks from json
    // Add bricks
    this.bricks.forEach(({ x, y, type }) => {
      const brick = new Brick({ game: this.game, x, y, type })
      this.bodies.push(brick.body)
    })

    const collisionMask = PLAYER_GROUP | BULLET_GROUP
    const shape_options = { collisionMask, collisionGroup: SCENERY_GROUP }
    // Add bts shapes
    this.static_shapes.forEach((shape) => {
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
    const setPosition = (sxy, offset) => {
      let dxy = sxy.split(',').map(Number)
      dxy = [dxy[0], -dxy[1]] // yflip
      dxy = vector.add(dxy, offset)
      player.body.position = vector.add(vector.times(this.world_xy0, 16), dxy)
      player.body.updateAABB()
    }
    for (let [sxy, type] of Object.entries(this.json.data.plm_overrides)) {
      if (type === 'ship') {
        return setPosition(sxy, [6, 1])
      }
      if (type === 'save-station') {
        return setPosition(sxy, [1, 1.5])
      }
    }
    throw 'Unable to find initial player placement'
  }
}
