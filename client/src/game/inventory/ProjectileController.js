import p2 from 'p2'
import { vec2, Ray, RaycastResult } from 'p2'

import { SCENERY_GROUP, POSTURE } from '../constants'

let next_bullet_id = 0
const RADIUS = 0.15

const aim = (player) => {
  const { body } = player
  const position = vec2.copy([0, 0], body.position) // start at player center
  position[1] = body.aabb.lowerBound[1] // bottom edge, center
  const half_width = body.shapes[0].width / 2
  const dx = player.collisions.faceDir
  const dxy = [dx, 0]

  const { pointing } = player.state
  if (pointing === 'down') {
    dxy[1] = -1
    dxy[0] = 0
  } else if (pointing === 'zenith') {
    dxy[0] = 0
    dxy[1] = 1
    position[1] += body.shapes[0].height // top
  } else if (pointing === 'upward') {
    dxy[1] = 1
    position[1] += 2.5
    position[0] += dx * half_width
  } else if (pointing === 'downward') {
    dxy[1] = -1
    position[1] += 1.5
    position[0] += dx * half_width
  } else {
    // pointing === null
    position[1] += 1.5
    position[0] += dx * half_width
  }
  if (player.state.posture === POSTURE.crouch) {
    position[1]--
  }
  return { position, dxy }
}

class Bullet {
  constructor(controller) {
    const { position, dxy } = aim(controller.player)
    const velocity = vec2.scale(vec2.create(), dxy, 18)
    this.reverse_velocity = vec2.scale(vec2.create(), velocity, -1 / 60)
    vec2.add(velocity, velocity, controller.player.velocity)
    this.controller = controller
    this.id = next_bullet_id++
    this.body = new p2.Body({ position, velocity })
    this.body.addShape(new p2.Circle({ radius: RADIUS }))
    this.player = controller.player
    this.player.game.bindEntity(this)
  }
  tick = () => {
    const { ray, raycastResult } = this.controller
    vec2.copy(ray.from, this.body.position)
    vec2.add(ray.to, ray.from, [RADIUS, RADIUS])
    vec2.add(ray.from, ray.from, this.reverse_velocity)
    ray.update()
    this.player.p2_world.raycast(raycastResult, ray)
    if (raycastResult.body) {
      this.player.p2_world.emit({
        type: 'damage',
        damage: {
          type: 'beam',
          player: this.player.id,
          amount: 1,
          body_id: raycastResult.body.id,
        },
      })
      this.destroy()
    }
    raycastResult.reset()
  }
  destroy() {
    this.player.game.removeEntity(this)
    delete this.controller.bullets[this.id]
  }
}

export default class ProjectileController {
  constructor({ player }) {
    this.player = player
    this.range = 10
    this.BULLET_SPEED = 25 // TODO 25 is totally arbitrary based of terminal velocity ~20
    this.ray = new Ray({ mode: Ray.CLOSEST, collisionMask: SCENERY_GROUP })
    this.raycastResult = new RaycastResult()
    this.player.game.p2_world.on('preSolve', this.tick)
    this.bullets = {}
  }
  shoot() {
    const bullet = new Bullet(this)
    this.bullets[bullet.id] = bullet
  }
  press() {
    this.shoot()
  }
  tick = () => {
    Object.values(this.bullets).forEach((b) => b.tick())
  }
  release() {}
}
