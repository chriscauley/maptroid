// Blocks are destructable terrain
import { SCENERY_GROUP, PLAYER_GROUP, BULLET_GROUP } from '../constants'
import p2 from 'p2'

export default class BaseEntity {
  constructor(options) {
    const { x, y, width = 1, height = 1, max_hp = 1, hp = max_hp, regrow, room } = options
    Object.assign(this, { x, y, width, height, max_hp, hp, regrow, room })
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
    let amount = event.amount
    if (amount <= 0 || this.hp <= 0) {
      // already died in previous damage
      return
    }
    this.hp -= amount
    if (this.hp <= 0) {
      this.destroy()
    }
  }

  respawn = () => {
    this.game.foregroundEntity(this)
    this.hp = this.max_hp
  }

  destroy = () => {
    const { regrow } = this
    if (regrow) {
      this.game.setTimeout(() => {
        this.game.backgroundEntity(this)
        this._death_timeout = this.game.setTimeout(this.respawn, regrow)
      }, 4)
    } else {
      this.game.setTimeout(() => this.game.removeEntity(this), 4)
    }
    this.room.clearOnFg(this)
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

  onCollide(_entity, _result) {
    return // noop
  }
}
