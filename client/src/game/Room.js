import { cloneDeep } from 'lodash'
import { vector } from '@unrest/geo'

import Brick from './Brick'
import { SCENERY_GROUP, BULLET_GROUP, PLAYER_GROUP, DXYS } from './constants'

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
  const shapes = []
  room.data.geometry.inner.forEach((geo) => {
    if (geo.interiors?.length) {
      throw `Room #{room.id} has interiors!`
    }
    shapes.push({
      exterior: geo.exterior.map((p) => p.slice()),
    })
  })
  return new Room({
    json: {
      bricks: [],
      static_boxes: [],
      shapes,
      screens: cloneDeep(room.data.geometry.screens),
    },
  })
}

const EDGE_BOUNDS = {
  '1,0': [15.1, 0, 0.9, 16],
  '-1,0': [0, 0, 0.9, 16],
  '0,1': [0, 15.1, 16, 0.9],
  '0,-1': [0, 0, 16, 0.9],
}

const EDGE_STARTS = {
  '1,0': [14.5, -8], // YFLIP
  '-1,0': [1.5, -8], // YFLIP
  '0,1': [8, -1.5], // YFLIP
  '0,-1': [8, -14.5], // YFLIP
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
    this.game = game
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
      const exterior = s.exterior.map((p) => this.screenToWorldXY(p))
      this.bodies.push(game.addStaticShape(exterior, shape_options))
    })

    // Add edges
    this.screens.forEach((screen) => {
      const options = { _color: 'rgba(255, 128, 128, 0.5)', collisionResponse: false }
      const [x, y] = this.screenToWorldXY(screen.room_xy)
      screen.edges.forEach((dxy) => {
        const [edge_x, edge_y, width, height] = EDGE_BOUNDS[dxy]
        const center_x = x + edge_x + width / 2
        const center_y = y - (edge_y + height / 2) // YFLIP

        const body = game.addStaticBox([center_x, center_y, width, height], options)
        this.bodies.push(body)
        this.edges.push(body)
      })
    })
  }

  positionPlayer(player) {
    this.game.world.bodies.forEach((b) => b.updateAABB())
    for (let screen of this.screens) {
      const world_xy = this.screenToWorldXY(screen.room_xy)
      for (let dxy of screen.edges) {
        dxy = EDGE_STARTS[dxy]
        player.body.position = vector.add(world_xy, dxy)
        player.body.updateAABB()
        const collided_with = this.bodies.find((body) => body.aabb.overlaps(player.body.aabb))
        if (!collided_with) {
          return
        }
      }
    }
    throw 'Unable to find initial player placement'
  }

  screenToWorldXY(screen_xy) {
    // YFLIP and multiply
    return [16 * screen_xy[0], -16 * screen_xy[1]]
  }
}
