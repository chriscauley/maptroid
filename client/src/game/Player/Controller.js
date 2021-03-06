import p2 from 'p2'

import RaycastController from './RaycastController'
import { POSTURE } from '../constants'

const { vec2, Ray, RaycastResult } = p2

export const UNIT_Y = vec2.fromValues(0, 1)
const DEG_TO_RAD = Math.PI / 180

// math helpers
function sign(x) {
  return x >= 0 ? 1 : -1
}
export function angle(a, b) {
  return Math.acos(vec2.dot(a, b))
}

export default class Controller extends RaycastController {
  constructor(options = {}) {
    super(options)

    const { maxClimbAngle = 80 * DEG_TO_RAD, maxDescendAngle = 80 * DEG_TO_RAD } = options
    Object.assign(this, { maxClimbAngle, maxDescendAngle })

    this.collisions = {
      above: false,
      below: false,
      left: false,
      right: false,
      last: {},
      climbingSlope: false,
      descendingSlope: false,
      slopeAngle: 0,
      slopeAngleOld: 0,
      velocityOld: vec2.create(),
      faceDir: 1,
      fallingThroughPlatform: false,
    }

    this.ray = new Ray({ mode: Ray.CLOSEST })
    this.raycastResult = new RaycastResult()

    this._last_collised_with = {}
    this.debounceCollision = (dxy) => {
      // this debouncing is mostly to stop it from colliding on all of the rays
      const now = this.getNow()
      const body = this.raycastResult.body
      if (now - this._last_collised_with[body.id] < 50) {
        return
      }
      this._last_collised_with[body.id] = now
      if (this.state.speeding && body._entity?.isWeakTo?.('speed-booster')) {
        this.p2_world.emit({
          type: 'damage',
          damage: {
            type: 'speed-booster',
            player: this.id,
            amount: 1,
            body_id: body.id,
          },
        })
      }
      this.emit({ type: 'collide', dxy, body })
    }
  }

  resetCollisions(velocity) {
    // note: velocity here is scaled to the time step
    const collisions = this.collisions

    if (this.physics.bouncekeep) {
      if (
        (!collisions.last.left && collisions.left) ||
        (!collisions.last.right && collisions.right)
      ) {
        // record the velocity and direction when hitting a wall (for bounce-keep)
        this.state.x_collide_velocity = collisions.last.velocity
        this.state.x_collide_dir = collisions.left ? -1 : 1
      }
    }
    collisions.last = {
      // using actual velocity instead of scaled velocity
      velocity: this.velocity.slice(),
    }

    if (collisions.below) {
      this.state.x_collide_velocity = [0, 0]
      this.state.x_collide_dir = 0
    }

    ;['left', 'right', 'above', 'below'].forEach((key) => (collisions.last[key] = collisions[key]))

    collisions.above = collisions.below = false
    collisions.left = collisions.right = false
    collisions.climbingSlope = false
    collisions.descendingSlope = false
    collisions.slopeAngleOld = collisions.slopeAngle
    collisions.slopeAngle = 0
    vec2.copy(collisions.velocityOld, velocity)
  }

  move(velocity) {
    const collisions = this.collisions
    this.last_rays = []

    this.updateRaycastOrigins()
    this.resetCollisions(velocity)

    collisions.faceDir = Math.sign(velocity[0]) || collisions.faceDir

    if (velocity[1] < 0) {
      this.descendSlope(velocity)
    }

    this.collidedWith = {}

    this.horizontalCollisions(velocity)
    this.verticalCollisions(velocity)

    vec2.add(this.body.position, this.body.position, velocity)

    if (!collisions.below && collisions.last.below) {
      const can_snap = !this.keys.jump
      if (can_snap) {
        this.snapToFloor()
      }
    }
  }

  snapToFloor() {
    // When player is running along ground and they hit a corner
    // they can "bounce" before climbSlope and descendSlope can take over
    const { raycastOrigins, ray } = this
    const distances = ['bottomRight', 'bottomLeft'].map((origin) => {
      const from = raycastOrigins[origin]
      const to = [from[0], from[1] - 0.5] // only checking 1/2 square away
      this.castRay(from, to)
      return Math.max(0, this.raycastResult.getHitDistance(ray))
    })
    const distance = Math.min(...distances)
    if (distance) {
      this.body.position[1] -= distance * 0.9 // 0.9 is because if it's too close it'll clip
      this.collisions.below = true
      this.velocity[1] -= distance * 60
    }
  }

  horizontalCollisions(velocity) {
    const { collisions, maxClimbAngle, skinWidth, raycastOrigins, ray } = this
    const directionX = collisions.faceDir
    let rayLength = Math.abs(velocity[0]) + skinWidth

    if (Math.abs(velocity[0]) < skinWidth) {
      rayLength = 2 * skinWidth
    }

    collisions._ortho_top = [0, 0]

    for (let i = 0; i < this.horizontalRayCount; i++) {
      const from = raycastOrigins[directionX === -1 ? 'bottomLeft' : 'bottomRight'].slice()
      from[1] += this.horizontalRaySpacing * i
      const to = [from[0] + directionX * rayLength, from[1]]
      this.castRay(from, to)

      if (this.raycastResult.body) {
        const dxy = [directionX, 0]
        if (this.raycastResult.body._entity?.is_item) {
          // item doens't affect players velocity
          this.emit({ type: 'collide', body: this.raycastResult.body, dxy })
          continue
        }

        const distance = this.raycastResult.getHitDistance(ray)
        if (distance === 0) {
          continue
        }

        const slopeAngle = angle(this.raycastResult.normal, UNIT_Y)

        if (i === 0 && slopeAngle <= maxClimbAngle) {
          if (collisions.descendingSlope) {
            collisions.descendingSlope = false
            vec2.copy(velocity, collisions.velocityOld)
          }
          let distanceToSlopeStart = 0
          if (slopeAngle !== collisions.slopeAngleOld) {
            distanceToSlopeStart = distance - skinWidth
            velocity[0] -= distanceToSlopeStart * directionX
          }
          this.climbSlope(velocity, slopeAngle)
          velocity[0] += distanceToSlopeStart * directionX
        }

        if (!collisions.climbingSlope || slopeAngle > maxClimbAngle) {
          this.debounceCollision(dxy)

          if (this.raycastResult.body._entity?.hp === 0) {
            continue
          }

          velocity[0] = (distance - skinWidth) * directionX
          rayLength = distance

          if (collisions.climbingSlope) {
            velocity[1] = Math.tan(collisions.slopeAngle) * Math.abs(velocity[0])
          }

          // "orthogonal vector" used in ricocheting off of ceilings
          if (i === this.horizontalRayCount - 1) {
            const normal = this.raycastResult.normal
            // rotate normal down and in direction player is facing
            collisions._ortho_top[0] = directionX * Math.abs(normal[1])
            collisions._ortho_top[1] = Math.sign(normal[1]) * Math.abs(normal[0])
          }

          if (directionX === -1) {
            collisions.left = true
          } else if (directionX === 1) {
            collisions.right = true
          }
        }
      }
    }
  }

  checkVertical(dy = 1) {
    let { posture } = this.state
    if (posture === POSTURE.spin) {
      posture = POSTURE.crouch
    }
    const { raycastOrigins } = this
    for (let i = 0; i < this.verticalRayCount; i++) {
      const from = raycastOrigins[dy > 0 ? 'topLeft' : 'bottomLeft'].slice()
      from[0] += this.verticalRaySpacing * i
      const to = [from[0], from[1] + dy]
      this.castRay(from, to)
      if (this.raycastResult.body) {
        break
      }
    }
    const can_stand = !this.raycastResult.body
    return can_stand
  }

  verticalCollisions(velocity) {
    const { collisions, skinWidth, raycastOrigins, ray } = this
    const directionY = sign(velocity[1])
    let rayLength = Math.abs(velocity[1]) + skinWidth

    for (let i = 0; i < this.verticalRayCount; i++) {
      const from = raycastOrigins[directionY === -1 ? 'bottomLeft' : 'topLeft'].slice()
      from[0] += this.verticalRaySpacing * i + velocity[0]
      const to = [from[0], from[1] + directionY * rayLength]
      this.castRay(from, to)

      if (this.raycastResult.body) {
        const dxy = [0, directionY]
        if (this.raycastResult.body._entity?.is_item) {
          // item doens't affect players velocity
          this.emit({ type: 'collide', body: this.raycastResult.body, dxy })
          continue
        }

        const distance = this.raycastResult.getHitDistance(ray)
        velocity[1] = (distance - skinWidth) * directionY
        rayLength = distance

        if (collisions.climbingSlope) {
          velocity[0] = (velocity[1] / Math.tan(collisions.slopeAngle)) * sign(velocity[0])
        }

        // yflip
        this.debounceCollision(dxy)
        if (directionY === -1) {
          collisions.below = true
        } else if (directionY === 1) {
          collisions.above = true
        }
      }
    }

    if (collisions.climbingSlope) {
      const directionX = sign(velocity[0])
      rayLength = Math.abs(velocity[0]) + skinWidth

      const from = raycastOrigins[directionX === -1 ? 'bottomLeft' : 'bottomRight'].slice()
      from[1] += velocity[1]
      const to = [from[0] + directionX * rayLength, from[1]]
      this.castRay(from, to)

      if (this.raycastResult.body) {
        const slopeAngle = angle(this.raycastResult.normal, UNIT_Y)
        if (slopeAngle !== collisions.slopeAngle) {
          velocity[0] = (this.raycastResult.getHitDistance(ray) - skinWidth) * directionX
          collisions.slopeAngle = slopeAngle
        }
      }
    }
  }

  climbSlope(velocity, slopeAngle) {
    const collisions = this.collisions
    const moveDistance = Math.abs(velocity[0])
    const climbVelocityY = Math.sin(slopeAngle) * moveDistance

    // yflip
    if (velocity[1] <= climbVelocityY) {
      velocity[1] = climbVelocityY
      velocity[0] = Math.cos(slopeAngle) * moveDistance * sign(velocity[0])
      collisions.below = true
      collisions.climbingSlope = true
      collisions.slopeAngle = slopeAngle
    }
  }

  descendSlope(velocity) {
    const { raycastOrigins, collisions, ray } = this
    const directionX = sign(velocity[0])

    const from = raycastOrigins[directionX === -1 ? 'bottomRight' : 'bottomLeft']
    const to = [from[0], from[1] - 1e6]
    this.castRay(from, to)

    if (this.raycastResult.body) {
      const slopeAngle = angle(this.raycastResult.normal, UNIT_Y)
      if (slopeAngle !== 0 && slopeAngle <= this.maxDescendAngle) {
        // on slope (up or down)
        if (sign(this.raycastResult.normal[0]) === directionX) {
          // facing down slope
          if (
            this.raycastResult.getHitDistance(ray) - this.skinWidth <=
            Math.tan(slopeAngle) * Math.abs(velocity[0])
          ) {
            const moveDistance = Math.abs(velocity[0])
            const descendVelocityY = Math.sin(slopeAngle) * moveDistance
            velocity[0] = Math.cos(slopeAngle) * moveDistance * sign(velocity[0])
            velocity[1] -= descendVelocityY // yflip

            collisions.slopeAngle = slopeAngle
            collisions.descendingSlope = true
            collisions.below = true
          }
        }
      }
    }
  }

  castRay(from, to) {
    this.raycastResult.reset()
    const ray = this.ray
    ray.collisionMask = this.collisionMask // TODO does this ever change?
    vec2.copy(ray.from, from)
    vec2.copy(ray.to, to)
    ray.update()
    this.p2_world.raycast(this.raycastResult, ray)

    // store ray for rendering
    this.last_rays.push([from, to])
  }
}
