import p2 from 'p2'

import { GROUP } from '../constants'
import BaseEntity from './BaseEntity'

const ray = new p2.Ray({
  mode: p2.Ray.ALL,
  collisionMask: GROUP.scenery | GROUP.item,
})

const result = new p2.RaycastResult()

export default class Explosion extends BaseEntity {
  makeBody() {
    this.radius = 0.2
    const { x, y } = this.options
    const shape = new p2.Circle({ radius: this.radius })
    const collisionGroup = GROUP.explosion
    const body = (this.body = new p2.Body({ position: [x, y], collisionGroup }))
    body.addShape(shape)
    body.updateAABB()
    this.dr = (this.options.max_radius - this.radius) / this.options.duration
    this.hit = {}
  }
  draw(ctx) {
    ctx.beginPath()
    ctx.fillStyle = 'white'
    const radius = this.body.shapes[0].radius
    ctx.arc(0, 0, radius, 0, 2 * Math.PI)
    ctx.fill()
    ctx.closePath()
  }

  tick() {
    if (this.radius === this.options.max_radius) {
      this.destroy()
    } else {
      this.radius = Math.min(this.radius + this.dr, this.options.max_radius)

      const shape = this.body.shapes[0]
      window.S = shape
      shape.radius = this.radius
      shape.updateBoundingRadius()
      shape.updateArea()

      // this.game.animations.push(() => this.draw(this.game.ctx))
      ray.from = this.body.position
      Object.values(this.game.entities).forEach((e) => {
        if (this.hit[e.id]) {
          return
        }
        ray.to = e.body.position
        ray.update()
        if (ray.length > e.body.boundingRadius + this.radius) {
          return
        }
        ray.callback = (r) => {
          const target_entity = r.body._entity
          if (target_entity && !this.hit[target_entity.id]) {
            this.hit[target_entity.id] = true
            this.game.p2_world.emit({
              damage: {
                type: 'bomb',
                player_id: this.game.player.id,
                amount: 1,
                body_id: r.body.id,
              },
              type: 'damage',
            })
          }
        }
        this.game.p2_world.raycast(result, ray)
      })
    }
  }
}
