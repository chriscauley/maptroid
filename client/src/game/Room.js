import { cloneDeep } from 'lodash'
import { vector } from '@unrest/geo'

import Brick from './Brick'
import { SCENERY_GROUP, BULLET_GROUP, PLAYER_GROUP } from './constants'

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

export const fromDb = (room) => {
  const start = [5, -3]
  const shapes = []
  room.data.geometry.inner.forEach((geo) => {
    if (geo.interiors?.length) {
      throw `Room #{room.id} has interiors!`
    }
    // YFLIP and multiply by 16 to convert from map coords to game coords
    shapes.push({
      exterior: geo.exterior.map((p) => [16 * p[0], -16 * p[1]]),
    })
  })
  return new Room({
    json: {
      bricks: [],
      static_boxes: [],
      shapes,
      start,
      screens: cloneDeep(room.data.geometry.screens),
    },
  })
}

const DXYS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

const EDGE_BOUNDS = {
  '1,0': [15.1, 0, 0.9, 16],
  '-1,0': [0, 0, 0.9, 16],
  '0,1': [0, 15.1, 16, 0.9],
  '0,-1': [0, 0, 16, 0.9],
}

class Room {
  constructor(options) {
    this.options = options
    this.json = options.json
    const _screens = {}
    this.json.screens.forEach((xy) => (_screens[xy] = true))
    this.screens = this.json.screens.map((room_xy) => {
      return {
        room_xy,
        edges: DXYS.filter((dxy) => !_screens[vector.add(dxy, room_xy)]),
      }
    })
  }

  bindGame(game) {
    this.bodies = []
    this.edges = []

    // Add static boxes (only in string_room's for now)
    this.json.static_boxes.forEach(({ x, y, width, height, angle }) => {
      this.bodies.push(game.addStaticBox(x, y, width, height, angle))
    })

    // Add bricks
    this.json.bricks.forEach(({ x, y, type }) => {
      const brick = new Brick({ game, x, y, type })
      this.bodies.push(brick.body)
    })

    const collisionMask = PLAYER_GROUP | BULLET_GROUP
    const shape_options = { collisionMask, collisionGroup: SCENERY_GROUP }
    // Add bts shapes
    this.json.shapes?.forEach((s) => {
      this.bodies.push(game.addStaticShape(s.exterior, shape_options))
    })

    // Add edges
    this.screens.forEach((screen) => {
      const options = { _color: 'rgba(255, 128, 128, 0.5)', collisionResponse: false }
      const [x, y] = screen.room_xy
      screen.edges.forEach((dxy) => {
        const [edge_x, edge_y, width, height] = EDGE_BOUNDS[dxy]
        const center_x = x * 16 + edge_x + width / 2
        const center_y = y * 16 + edge_y + height / 2

        // YFLIP
        const body = game.addStaticBox([center_x, -center_y, width, height], options)
        this.bodies.push(body)
        this.edges.push(body)
      })
    })
  }
}
