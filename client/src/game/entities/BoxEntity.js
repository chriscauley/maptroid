// Blocks are destructable terrain
import BaseEntity from './BaseEntity'
import { GROUP } from '../constants'
import p2 from 'p2'

export default class BoxEntity extends BaseEntity {
  makeBody() {
    const { x, y, width, height } = this.options
    const collisionMask = GROUP.player | GROUP.bullet
    const { collisionGroup = GROUP.scenery } = this.options
    const shape = new p2.Box({ collisionGroup, collisionMask, width, height })
    const body = (this.body = new p2.Body({ position: [x, y] }))
    body._entity = this
    body.addShape(shape)
    body.updateAABB()
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
    ctx.strokeStyle = this.color
    ctx.lineWidth = 4 / 16
    ctx.strokeRect(-width / 2, -height / 2, width, height)
  }
}
