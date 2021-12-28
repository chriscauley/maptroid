import { sortBy } from 'lodash'
import { vec2, Ray, RaycastResult } from 'p2'

import { SCENERY_GROUP, POSTURE } from '../constants'
import drawRay from '../drawRay'
import vec from '../vec'

export default class BeamController {
  constructor({ player }) {
    this.player = player
    this.range = 10
    this.BULLET_SPEED = 25 // TODO 25 is totally arbitrary based of terminal velocity ~20
    this.ray = new Ray({ mode: Ray.CLOSEST, collisionMask: SCENERY_GROUP })
    this.raycastResult = new RaycastResult()
  }
  shoot() {
    const { ray, raycastResult } = this
    let hits = []

    // use the center between the from of first two rays as the "start" of all rays
    const [ray0, ray1] = this.player.beam_rays
    const start = [(ray0[0][0] + ray1[0][0]) / 2, (ray0[0][1] + ray1[0][1]) / 2]

    this.player.beam_rays.forEach(([from, to], ray_no) => {
      vec2.add(ray.from, this.player.body.position, from)
      vec2.add(ray.to, this.player.body.position, to)
      ray.update()
      this.player.world.raycast(raycastResult, ray)
      if (raycastResult.body) {
        let ray_to_hit = raycastResult.getHitDistance(ray)
        if (this.player.world.hitTest(ray.from, [raycastResult.body]).length) {
          ray_to_hit = 0
        }
        const player_to_ray = vec2.distance(start, from)
        const player_to_ray_hit = ray_to_hit + player_to_ray
        // const player_to_body_center = vec2.distance(start, raycastResult.body.position)
        hits.push({
          ray_no,
          body: raycastResult.body,
          distance: player_to_ray_hit,
        })
      }
      raycastResult.reset()
    })
    hits = sortBy(hits, 'distance')
    if (hits.length) {
      this.player.world.emit({
        type: 'damage',
        damage: {
          type: 'beam',
          player: this.player.id,
          amount: 1,
          body_id: hits[0].body.id,
        },
      })
    }
  }
  press() {
    this.shoot()
  }
  release() {}
  getPositionAndDxy() {
    const { body } = this.player
    const position = vec2.copy([0, 0], body.position) // start at player center
    position[1] = body.aabb.lowerBound[1] // bottom edge, center
    const half_width = body.shapes[0].width / 2
    const dx = this.player.collisions.faceDir
    const dxy = [dx, 0]

    const { pointing } = this.player.state
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
    if (this.player.state.posture === POSTURE.crouch) {
      position[1]--
    }
    return [position, dxy]
  }
  draw(ctx) {
    const [from, dxy] = this.getPositionAndDxy()
    const to = vec.add(from, vec.scale(dxy, this.range))
    ctx.lineWidth = 1 / this.player.game.zoom
    ctx.strokeStyle = 'white'
    drawRay(ctx, [from, to])
  }
}
