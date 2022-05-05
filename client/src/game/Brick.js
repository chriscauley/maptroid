// Bricks are destructable terrain
import { minBy } from 'lodash'
import { SCENERY_GROUP, PLAYER_GROUP, BULLET_GROUP } from './constants'
import p2 from 'p2'

const TYPES = {
  moss: {
    color: 'green',
    regrow: 30,
  },
  bomb: {
    color: 'rgb(255, 33, 33)',
    weak_to: ['bomb', 'speed', 'screw', 'beam'], // TODO remove beam
  },
  shot: {
    color: 'rgb(200, 200, 200)',
  },
  crumble: {
    weak_to: 'crumble',
    color: 'rgb(255, 200, 200)',
    onCollide(self, entity, result) {
      if (entity.is_player && result.dxy[1] === -1) {
        self.damage({ type: 'crumble', amount: 1 })
      }
    },
  },
  'power-bomb': {
    color: 'rgb(255, 255, 128)',
  },
  'super-missile': {
    color: 'rgb(128,255,128)',
  },
  grapple: {
    color: 'rgb(128, 255, 255)',
  },
  'grapple-break': {
    color: 'rgb(0, 128, 128)',
  },
  default: {
    color: 'rgb(255, 128, 128)',
  },
  door: {
    color: 'blue',
  },
}

export default class Brick {
  constructor(options) {
    const _type = TYPES[options.type] || TYPES['default']
    const { max_hp = 1 } = _type
    const { x, y, width = 1, height = 1, type, hp = max_hp, room } = options
    Object.assign(this, { type, x, y, width, height, hp, _type, max_hp, room })
    this.game = room.game
    this.makeBody()
    this.game.bindEntity(this)
  }
  makeBody() {
    const { x, y, width, height } = this
    const collisionMask = PLAYER_GROUP | BULLET_GROUP
    const shape = new p2.Box({ collisionGroup: SCENERY_GROUP, collisionMask, width, height })
    const body = (this.body = new p2.Body({ position: [x, y] }))
    body.addShape(shape)
    body.updateAABB()
  }
  damage(event) {
    if (this._type.weak_to && !this._type.weak_to.includes(event.type)) {
      return
    }
    let amount = event.amount
    if (amount <= 0 || this.hp <= 0) {
      return
    }
    this.hp -= amount
    if (this.hp <= 0) {
      const { regrow } = this._type
      if (regrow) {
        this.game.backgroundEntity(this)
        this._death_timeout = this.game.setTimeout(this.respawn, regrow)
      } else {
        this.destroy()
      }
    }
  }
  respawn = () => {
    this.game.foregroundEntity(this)
    this.hp = this.max_hp
  }
  destroy() {
    this.game.removeEntity(this)
  }
  draw(ctx) {
    const { width, height } = this.body.shapes[0]
    if (this.hp <= 0) {
      ctx.globalAlpha = 0.25
      const respawn_in = this._death_timeout?.when - this.game.p2_world.time
      if (respawn_in < 1) {
        ctx.globalAlpha = Math.floor(this.game.p2_world.time * 10) % 2 ? 0.5 : 0.25
      }
    }
    ctx.strokeStyle = this._type.color
    ctx.lineWidth = 4 / 16
    ctx.strokeRect(-width / 2, -height / 2, width, height)
  }
  onCollide(entity, result) {
    this._type.onCollide?.(this, entity, result)
  }
}

export class Door extends Brick {
  constructor(options) {
    super(options)
    const { color, orientation } = options
    Object.assign(this, { color, orientation })
    this.respawn_aabb = new p2.AABB()
    this.respawn_aabb.copy(this.body.aabb)
    if (orientation === 'left') {
      this.respawn_aabb.upperBound[0] -= 1
      this.respawn_aabb.lowerBound[0] -= 1
    } else if (orientation === 'right') {
      this.respawn_aabb.upperBound[0] += 1
      this.respawn_aabb.lowerBound[0] += 1
    } else if (orientation === 'up') {
      this.respawn_aabb.upperBound[0] += 8
      this.respawn_aabb.lowerBound[0] -= 8
      this.respawn_aabb.upperBound[1] += 2
      this.respawn_aabb.lowerBound[1] += 2
    } else if (orientation === 'down') {
      this.respawn_aabb.upperBound[0] += 8
      this.respawn_aabb.lowerBound[0] -= 8
      this.respawn_aabb.upperBound[1] -= 2
      this.respawn_aabb.lowerBound[1] -= 2
    }
  }
  damage(event) {
    if (this._type.weak_to && !this._type.weak_to.includes(event.type)) {
      return
    }
    const edge = this.room.edges.find((e) => e.aabb.containsPoint(this.body.position))
    const target_room = this.game.world_controller.room_map[edge?._target_xy]
    if (target_room) {
      target_room.bindGame(this.game)
      const target_door = minBy(target_room.doors, (door) =>
        p2.vec2.squaredDistance(edge.position, door.body.position),
      )
      this.game.backgroundEntity(target_door)
      target_door.hidden = true
      target_door.needs_close = this
    } else {
      console.warn('unable to find target room')
    }
    this.game.backgroundEntity(this)
    this.hidden = true
  }
  draw(ctx) {
    if (!this.hidden) {
      super.draw(ctx)
    }
  }
  closeDoors() {
    this.game.foregroundEntity(this)
    this.hidden = false
    this.game.foregroundEntity(this.needs_close)
    this.needs_close.hidden = false
    delete this.needs_close
  }
}
