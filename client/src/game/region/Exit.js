import p2 from 'p2'
import { isEqual } from 'lodash'
import { vector, mod } from '@unrest/geo'

import BaseRegion from './BaseRegion'

export default class Exit extends BaseRegion {
  constructor(options) {
    options.type = 'exit'
    options.canCollide = (_exit, entity) => entity.is_player
    options.onCollide = (exit, entity) => {
      exit.bindTargets()
      exit.game.player.enterRoom(exit.room)
      entity.save_state.entrance_number = exit.options.entrance_number
      entity.save_state.room_id = exit.room.id
    }

    super(options)
    this.entrance_number = `${this.options.x},${this.options.y}`
  }
  makeBody() {
    const [room_X, room_Y] = this.room.world_xy0
    let { x, y, width, height } = this.options
    if (mod(x, 16) === 15) {
      x -= 3
      width += 3
      this.target_dxy = [1, 0]
      this.start_position = [-2, 0]
    } else if (mod(x, 16) === 0) {
      width += 3
      this.target_dxy = [-1, 0]
      this.start_position = [2, 0]
    } else if (mod(y, 16) === 15) {
      y -= 3
      height += 3
      this.target_dxy = [0, 1]
      this.start_position = [0, -2]
    } else if (mod(y, 16) === 0) {
      height += 3
      this.target_dxy = [0, -1]
      this.start_position = [0, 2.5]
    } else {
      const elevator = this.room.bodies.find((b) => {
        const e = b._entity
        const [_x, _y] = e?.room_xy || []
        // TODO where does this +1 come from on y?!?
        return e?.type === 'elevator' && _x === x && _y === y + 1
      })
      if (!elevator) {
        console.warn('cannot place exit', x, y, width, height)
      }
      // elevators are handled via an entity
      // this is just so that it is visible in debug
      this.start_position = [1, -2]
      this.target_dxy = []
    }

    const edge_x = 16 * room_X + x
    const edge_y = 16 * room_Y + y
    const center_x = edge_x + width / 2
    const center_y = edge_y + height / 2
    this.screen_xy = vector.add([room_X, room_Y], [parseInt(x / 16), parseInt(y / 16)])
    if (this.target_dxy[1] === -1) {
      // Issue #182000795
      this.screen_xy[1]++
    }
    super.makeBody({ x: center_x, y: center_y, width, height })
  }

  bindTargets() {
    if (this.target_room) {
      return
    }
    const default_target_xy = vector.add(this.target_dxy, this.screen_xy)
    this.target_screen_xy = default_target_xy
    let target_room = this.game.world_controller.room_map[default_target_xy]
    if (!target_room) {
      const { width, height } = this.body.shapes[0]

      // loop over elevators in current screen_xy and see if any could connect
      const elevators = this.game.world_controller.elevators[this.screen_xy] || []
      elevators.forEach(([target_xy, _dxy]) => {
        if (!isEqual(_dxy, this.target_dxy)) {
          // elevator exit is not pointing in right direction
          return
        }
        if (target_room) {
          console.error('multiple target rooms detected')
        }
        this.target_screen_xy = target_xy
        target_room = this.game.world_controller.room_map[target_xy]
        const dxy_to_portal = p2.vec2.multiply(p2.vec2.create(), [width, height], this.target_dxy)
        const [x, y] = p2.vec2.add(p2.vec2.create(), this.body.position, dxy_to_portal)
        target_room.bindGame(this.game)
        new BaseRegion({
          x,
          y,
          width,
          height,
          type: 'portal',
          room: this.room,
          canCollide: (_portal, entity) => entity.is_player,
          onCollide: (_portal, entity) => {
            const delta = p2.vec2.subtract(p2.vec2.create(), target_xy, this.screen_xy)
            if (delta[0]) {
              delta[0] += -Math.sign(delta[0])
            }
            if (delta[1]) {
              delta[1] += -Math.sign(delta[1])
            }
            p2.vec2.add(entity.body.position, entity.body.position, [delta[0] * 16, delta[1] * 16])
            this.game.syncCamera()
          },
        })
      })
    }
    if (target_room) {
      target_room.bindGame(this.room.game)
      target_room.exits.forEach((target_exit) => {
        if (isEqual(target_exit.screen_xy, this.target_screen_xy)) {
          this.target_exit = target_exit
        }
      })
      target_room.bindGame(this.game)
      this.target_room = target_room
    } else {
      console.error(this.id, 'no room at', this.target_xy)
    }
  }

  getDoor() {
    return this.room.doors.find((door) => this.body.aabb.containsPoint(door.body.position))
  }
}
