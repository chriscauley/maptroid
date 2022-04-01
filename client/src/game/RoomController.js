import { cloneDeep } from 'lodash'
import { vector } from '@unrest/geo'

import Brick from './Brick'
import { SCENERY_GROUP, BULLET_GROUP, PLAYER_GROUP, DXYS } from './constants'

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

// TODO needs yflip(?)
const EDGE_BOUNDS = {
  '1,0': [15.1, -16, 0.9, 16], // YFLIP
  '-1,0': [0, -16, 0.9, 16], // YFLIP
  '0,1': [0, -0.9, 16, 0.9], // YFLIP
  '0,-1': [0, -16, 16, 0.9], // YFLIP
}

const EDGE_STARTS = {
  '1,0': [14.5, -8], // YFLIP
  '-1,0': [1.5, -8], // YFLIP
  '0,1': [8, -1.5], // YFLIP
  '0,-1': [8, -14.5], // YFLIP
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
    const _screen_exists = {}
    screen_xys.forEach((xy) => (_screen_exists[xy] = true))
    this.screens = screen_xys.map((world_xy) => {
      return {
        world_xy,
        edges: DXYS.filter((dxy) => !_screen_exists[vector.add(dxy, world_xy)]),
      }
    })
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

  bindGame(game) {
    this.game = game
    this.bodies = []
    this.edges = []
    this.bricks = []

    // TODO populate bricks from json
    // Add bricks
    this.bricks.forEach(({ x, y, type }) => {
      const brick = new Brick({ game, x, y, type })
      this.bodies.push(brick.body)
    })

    const collisionMask = PLAYER_GROUP | BULLET_GROUP
    const shape_options = { collisionMask, collisionGroup: SCENERY_GROUP }
    // Add bts shapes
    this.static_shapes.forEach((shape) => {
      this.bodies.push(game.addStaticShape(shape.exterior, shape_options))
    })

    // Add edges
    this.screens.forEach((screen) => {
      const options = { _color: 'rgba(255, 128, 128, 0.5)', collisionResponse: false }
      const [x, y] = screen.world_xy
      screen.edges.forEach((dxy) => {
        const [edge_x, edge_y, width, height] = EDGE_BOUNDS[dxy]
        const center_x = 16 * x + edge_x + width / 2
        const center_y = 16 * y + edge_y + height / 2

        const body = game.addStaticBox([center_x, center_y, width, height], options)
        this.bodies.push(body)
        this.edges.push(body)
      })
    })
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
