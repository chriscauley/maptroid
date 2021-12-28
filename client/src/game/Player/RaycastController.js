import p2 from 'p2'

const { vec2, EventEmitter, AABB } = p2

// math helpers
function expandAABB(aabb, amount) {
  const halfAmount = amount * 0.5
  aabb.lowerBound[0] -= halfAmount
  aabb.lowerBound[1] -= halfAmount
  aabb.upperBound[0] += halfAmount
  aabb.upperBound[1] += halfAmount
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export default class RaycastController extends EventEmitter {
  constructor(options = {}) {
    super(options)

    this.world = options.world
    this.body = options.body
    this.id = options.body.id

    const {
      collisionMask = -1,
      skinWidth = 0.015,
      horizontalRayCount = 4,
      verticalRayCount = 4,
    } = options

    Object.assign(this, { collisionMask, skinWidth, horizontalRayCount, verticalRayCount })

    this.horizontalRaySpacing = null
    this.verticalRaySpacing = null

    this.lastCollisionBody = null
    this.raycastOrigins = {
      topLeft: vec2.create(),
      topRight: vec2.create(),
      bottomLeft: vec2.create(),
      bottomRight: vec2.create(),
    }

    this.updateRaycastOrigins = (() => {
      const bounds = new AABB()
      return () => {
        this.body.aabbNeedsUpdate = true
        this.calculateRaySpacing()
        bounds.copy(this.body.getAABB())

        expandAABB(bounds, this.skinWidth * -2)

        const raycastOrigins = this.raycastOrigins

        vec2.copy(raycastOrigins.bottomLeft, bounds.lowerBound)
        vec2.set(raycastOrigins.bottomRight, bounds.upperBound[0], bounds.lowerBound[1])
        vec2.set(raycastOrigins.topLeft, bounds.lowerBound[0], bounds.upperBound[1])
        vec2.copy(raycastOrigins.topRight, bounds.upperBound)
      }
    })()

    this.calculateRaySpacing = (() => {
      const bounds = new AABB()
      return () => {
        this.body.aabbNeedsUpdate = true
        bounds.copy(this.body.getAABB())
        expandAABB(bounds, this.skinWidth * -2)

        this.horizontalRayCount = clamp(this.horizontalRayCount, 2, Number.MAX_SAFE_INTEGER)
        this.verticalRayCount = clamp(this.verticalRayCount, 2, Number.MAX_SAFE_INTEGER)

        const sizeX = bounds.upperBound[0] - bounds.lowerBound[0]
        const sizeY = bounds.upperBound[1] - bounds.lowerBound[1]
        this.horizontalRaySpacing = sizeY / (this.horizontalRayCount - 1)
        this.verticalRaySpacing = sizeX / (this.verticalRayCount - 1)
      }
    })()

    this.calculateRaySpacing()
  }
}
