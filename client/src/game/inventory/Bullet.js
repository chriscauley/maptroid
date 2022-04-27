import p2, { vec2 } from 'p2'
import SpriteSheet from '@/views/SpriteSheet/store'

import { POSTURE } from '../constants'
import { getAsset } from '../useAssets'

let next_bullet_id = 0
const RADIUS = 0.15

const SPEED = 18
const LIFETIME = 888 // Bullet should travel ~1 screen when fired at rest
const root2over2 = Math.sqrt(2) / 2

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
    dxy[0] *= root2over2
    dxy[1] = root2over2
    position[1] += 2.5
    position[0] += dx * half_width
  } else if (pointing === 'downward') {
    dxy[0] *= root2over2
    dxy[1] = -root2over2
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

const DXY_TO_FRAME = {
  '0,1': 0, // UP
  '1,1': 1, // UP RIGHT
  '1,0': 2, // RIGHT
  '1,-1': 3, // DOWN RIGHT
  '0,-1': 4, // DOWN
  '-1,-1': 5, // DOWN LEFT
  '-1,0': 6, // LEFT
  '-1,1': 7, // UP LEFT
}

// factor for converting ms to radians for wave beam
// 2*PI rad/cycle * (1 cycle/16 frames) * (60 frame / 1000 ms)
const rad_per_ms = 2 * Math.PI * (1 / 16) * (60 / 1000)

const logVec = (...args) => console.log( // eslint-disable-line
    ...args.map((v) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`),
  )

const _trash = vec2.create()

export default class Bullet {
  constructor(controller, options) {
    const { position, dxy } = aim(controller.player)
    this.dxy_frame = DXY_TO_FRAME[[Math.sign(dxy[0]), Math.sign(dxy[1])]]
    const velocity = vec2.scale(vec2.create(), dxy, SPEED)
    this.reverse_velocity = vec2.scale(vec2.create(), velocity, -1 / 30)
    this.wave = options.wave
    this.y_offset = options.y_offset || 0

    // Add player's y velocity if they aren't pointing in the x direction
    if (!dxy[0]) {
      velocity[1] += controller.player.velocity[1]
    }
    // Do the same, but for the x velocity and y direction
    if (!dxy[1]) {
      velocity[0] += controller.player.velocity[0]
    }

    this.velocity0 = vec2.clone(velocity)
    this.controller = controller
    this.id = next_bullet_id++
    const angle = Math.atan2(dxy[1], dxy[0])
    this.body = new p2.Body({ position, velocity, angle })
    this.body.addShape(new p2.Circle({ radius: RADIUS }))
    this.body.shapes[0].position[1] = this.y_offset
    this.controller.player.game.bindEntity(this)
    this.start = controller.player.getNow()
    this.spritename = this.getSpriteName()
  }
  tick = () => {
    const { ray, raycastResult, player } = this.controller
    if (this.wave) {
      const dt = this.controller.player.getNow() - this.start
      this.body.shapes[0].position[1] = this.wave * Math.sin(rad_per_ms * dt)
    }
    this.body.toWorldFrame(ray.from, this.body.shapes[0].position)
    vec2.add(ray.to, ray.from, [RADIUS, RADIUS])
    vec2.add(ray.from, ray.from, this.reverse_velocity)
    ray.update()
    player.p2_world.raycast(raycastResult, ray)
    if (raycastResult.body) {
      player.p2_world.emit({
        type: 'damage',
        damage: {
          type: 'beam',
          player: player.id,
          amount: 1,
          body_id: raycastResult.body.id,
        },
      })
      this.destroy()
    } else if (this.controller.player.getNow() - this.start > LIFETIME) {
      this.destroy()
    }
    raycastResult.reset()
  }
  destroy() {
    this.controller.player.game.removeEntity(this)
    delete this.controller.bullets[this.id]
  }
  getSpriteName() {
    return 'missile'
  }
  getSpriteParams() {
    if (true) {
      // useAssets
      const { img, sw, sh } = getAsset('wave-beam-bullets')
      const sx = 0
      const sy = 0
      return { img, sx, sy, sw, sh }
    }
    // uses spritesheet
    const { getAnimationParams } = SpriteSheet('weapons')
    const frame = this.dxy_frame

    return getAnimationParams(this.spritename, frame, true)
  }
  draw(ctx) {
    const [shape_x, shape_y] = this.body.shapes[0].position
    const _ise = ctx.imageSmoothingEnabled
    ctx.imageSmoothingEnabled = false
    const { img, sx, sy, sw, sh } = renderers['ice-beam'](this)
    const dw = sw / 16
    const dh = sh / 16
    const dx = shape_x - dw / 2
    const dy = shape_y - dh / 2
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
    ctx.imageSmoothingEnabled = _ise

    ctx.closePath()
  }
}

const renderers = {
  'wave-beam': () => {
    const { img, sw, sh } = getAsset('wave-beam-bullets')
    const sx = 0
    const sy = 0
    return { img, sx, sy, sw, sh }
  },
  'ice-beam': (bullet) => {
    const { img, sw, sh } = getAsset('ice-beam-bullets')
    const sx = Math.floor(bullet.controller.player.getNow() / 240) % 2 ? 0 : sw
    const sy = 0
    return { img, sx, sy, sw, sh }
  },
}
