// Bricks are destructable terrain
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
    color: 'rgb(255, 200, 200)',
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
}

export default class Brick {
  constructor(options) {
    const _type = TYPES[options.type]
    const { max_hp = 1 } = _type
    const { game, x, y, width = 1, height = 1, type, hp = max_hp } = options
    Object.assign(this, { game, type, x, y, width, height, hp, _type, max_hp })
    this.makeBody()
    this.game.bindEntity(this)
  }
  makeBody() {
    const { x, y, width, height } = this
    const collisionMask = PLAYER_GROUP | BULLET_GROUP
    const shape = new p2.Box({ collisionGroup: SCENERY_GROUP, collisionMask, width, height })
    const body = (this.body = new p2.Body({ position: [x, y] }))
    body.addShape(shape)
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
    ctx.fillStyle = this._type.color
    ctx.fillRect(-width / 2, -height / 2, width, height)
  }
}
