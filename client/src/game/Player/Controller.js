import p2 from 'p2'
import RaycastController from './RaycastController'

const { vec2, Ray, RaycastResult } = p2

const UNIT_Y = vec2.fromValues(0, 1)
const DEG_TO_RAD = Math.PI / 180

// math helpers
function sign(x) {
  return x >= 0 ? 1 : -1
}
function angle(a, b) {
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

    this.lastCollisions = {}
    this.debounceCollision = (dxy) => {
      // this debouncing is mostly to stop it from colliding on all of the rays
      const now = new Date().valueOf()
      const body = this.raycastResult.body
      if (now - this.lastCollisions[body.id] < 1000) {
        return
      }
      this.lastCollisions[body.id] = now
      this.emit({ type: 'collide', dxy, body })
    }
  }

  resetCollisions(velocity) {
    const collisions = this.collisions

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
    if (velocity[1] !== 0) {
      this.verticalCollisions(velocity)
    }

    vec2.add(this.body.position, this.body.position, velocity)
  }

  horizontalCollisions(velocity) {
    const { collisions, maxClimbAngle, skinWidth, raycastOrigins, ray } = this
    const directionX = collisions.faceDir
    let rayLength = Math.abs(velocity[0]) + skinWidth

    // if (Math.abs(velocity[0]) < skinWidth) {
    // rayLength = 2 * skinWidth;
    // }

    for (let i = 0; i < this.horizontalRayCount; i++) {
      const from = raycastOrigins[directionX === -1 ? 'bottomLeft' : 'bottomRight'].slice()
      from[1] += this.horizontalRaySpacing * i
      const to = [from[0] + directionX * rayLength, from[1]]
      this.castRay(from, to)

      if (this.raycastResult.body) {
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
          velocity[0] = (distance - skinWidth) * directionX
          rayLength = distance

          if (collisions.climbingSlope) {
            velocity[1] = Math.tan(collisions.slopeAngle) * Math.abs(velocity[0])
          }

          if (directionX === -1) {
            this.debounceCollision([-1, 0])
            collisions.left = true
          } else if (directionX === 1) {
            this.debounceCollision([1, 0])
            collisions.right = true
          }
        }
      }

      this.raycastResult.reset()
    }
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
        const distance = this.raycastResult.getHitDistance(ray)
        velocity[1] = (distance - skinWidth) * directionY
        rayLength = distance

        if (collisions.climbingSlope) {
          velocity[0] = (velocity[1] / Math.tan(collisions.slopeAngle)) * sign(velocity[0])
        }

        if (directionY === -1) {
          this.debounceCollision([0, -1])
          collisions.below = true
        } else if (directionY === 1) {
          this.debounceCollision([0, 1])
          collisions.above = true
        }
      }

      this.raycastResult.reset()
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
        if (sign(this.raycastResult.normal[0]) === directionX) {
          if (
            this.raycastResult.getHitDistance(ray) - this.skinWidth <=
            Math.tan(slopeAngle) * Math.abs(velocity[0])
          ) {
            const moveDistance = Math.abs(velocity[0])
            const descendVelocityY = Math.sin(slopeAngle) * moveDistance
            velocity[0] = Math.cos(slopeAngle) * moveDistance * sign(velocity[0])
            velocity[1] -= descendVelocityY

            collisions.slopeAngle = slopeAngle
            collisions.descendingSlope = true
            collisions.below = true
          }
        }
      }
    }

    this.raycastResult.reset()
  }

  castRay(from, to) {
    const ray = this.ray
    ray.collisionMask = this.collisionMask // TODO does this ever change?
    vec2.copy(ray.from, from)
    vec2.copy(ray.to, to)
    ray.update()
    this.world.raycast(this.raycastResult, ray)

    // store ray for rendering
    this.last_rays.push([from, to])
  }
}
