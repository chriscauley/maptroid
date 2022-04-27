import p2, { vec2 } from 'p2'
import SpriteSheet from '@/views/SpriteSheet/store'

import { POSTURE } from '../constants'
import { getAsset } from '../useAssets'

let next_bullet_id = 0
const RADIUS = 0.15

const SPEED = 18
const LIFETIME = 888 // Bullet should travel ~1 screen when fired at rest
const root2over2 = Math.sqrt(2) / 2

const BEAMS = ['plasma', 'spazer', 'wave', 'ice']

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

    this.freq = controller.enabled['plasma-beam'] ? rad_per_ms / 2 : rad_per_ms

    this.velocity0 = vec2.clone(velocity)
    this.controller = controller
    this.id = next_bullet_id++
    const angle = Math.atan2(dxy[1], dxy[0])
    this.body = new p2.Body({ position, velocity, angle })
    this.body.addShape(new p2.Circle({ radius: RADIUS }))
    this.body.shapes[0].position[1] = this.y_offset
    this.controller.player.game.bindEntity(this)
    this.start = controller.player.getNow()
    this.setRenderer()
    this.frame = 0
  }
  tick = () => {
    this.frame++
    const { ray, raycastResult, player } = this.controller
    if (this.wave) {
      const dt = this.controller.player.getNow() - this.start
      this.body.shapes[0].position[1] = this.wave * Math.sin(this.freq * dt)
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
  draw(ctx) {
    const _ise = ctx.imageSmoothingEnabled
    ctx.imageSmoothingEnabled = false
    if (this._last && this.frame % 1) {
      ctx.drawImage(...this._last)
    } else {
      const [shape_x, shape_y] = this.body.shapes[0].position
      const { img, sx, sy, sw, sh } = this.renderer(this)
      const dw = sw / 16
      const dh = sh / 16
      const dx = shape_x - dw / 2
      const dy = shape_y - dh / 2
      this._last = [img, sx, sy, sw, sh, dx, dy, dw, dh]
      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
    }
    ctx.imageSmoothingEnabled = _ise
  }

  setRenderer() {
    const { enabled } = this.controller
    let slug = BEAMS.filter((s) => enabled[s + '-beam']).join('_')
    if (self.charged) {
      slug = 'charged_' + slug
    }
    if (['', 'missile', 'super-missile'].includes(slug)) {
      this.body.angle = 0
    }
    this.renderer = renderers[slug]
  }
}

const longRenderer = (index) => () => {
  const { img } = getAsset('long-beam-bullets')
  const sh = 7
  return { img, sh, sw: 56, sx: 0, sy: index * sh }
}

const chargedLongRenderer = (index) => (bullet) => {
  const { img } = getAsset('long-beam-bullets')
  const sh = 7
  const dy = Math.floor(bullet.controller.player.getNow() / 240) % 2 ? 0 : 1
  return { img, sh, sw: 56, sx: 0, sy: (index + dy) * sh }
}

const weaponSheetRenderer = (spritename) => (bullet) => {
  const { getAnimationParams } = SpriteSheet('weapons')
  const frame = bullet.dxy_frame

  return getAnimationParams(spritename, frame, true)
}

const renderers = {
  '': weaponSheetRenderer('beam'),
  charged_: () => {
    throw 'TODO'
  },

  ice: (bullet) => {
    const { img, sw, sh } = getAsset('ice-beam-bullets')
    const sx = Math.floor(bullet.controller.player.getNow() / 240) % 2 ? 0 : sw
    const sy = 0
    return { img, sx, sy, sw, sh }
  },
  charged_ice: () => {
    throw 'TODO'
  },

  wave: () => {
    const { img, sw, sh } = getAsset('wave-beam-bullets')
    const sx = 0
    const sy = 0
    return { img, sx, sy, sw, sh }
  },
  charged_wave: () => {
    throw 'TODO'
  },
  wave_ice: () => {
    throw 'TODO'
  },
  charged_wave_ice: () => {
    throw 'TODO'
  },

  plasma: longRenderer(0),
  plasma_ice: longRenderer(3),
  charged_plasma: chargedLongRenderer(1),
  charged_plasma_ice: chargedLongRenderer(4),

  spazer: longRenderer(8),
  spazer_ice: longRenderer(12),
  spazer_wave: longRenderer(5),

  charged_spazer: chargedLongRenderer(9),
  charged_spazer_ice: chargedLongRenderer(13),
  charged_spazer_wave: chargedLongRenderer(6),
}

// wave + plasma and plasma + spazer doesn't affect renderer
renderers['plasma_wave'] = renderers['plasma']
renderers['plasma_wave_ice'] = renderers['plasma_ice']
renderers['charged_plasma_wave'] = renderers['charged_plasma']
renderers['charged_plasma_wave_ice'] = renderers['charged_plasma_ice']
renderers['plasma_spazer'] = renderers['plasma']
renderers['plasma_spazer_ice'] = renderers['plasma_ice']
renderers['charged_plasma_spazer'] = renderers['plasma']
renderers['charged_plasma_spazer_ice'] = renderers['plasma_ice']
renderers['plasma_spazer_wave'] = renderers['plasma']
renderers['plasma_spazer_wave_ice'] = renderers['plasma_ice']
renderers['charged_plasma_spazer_wave'] = renderers['charged_plasma']
renderers['charged_plasma_spazer_wave_ice'] = renderers['charged_plasma_ice']

// spazer_wave_ice is same as spazer_ice
renderers['spazer_wave_ice'] = renderers['spazer_ice']
renderers['charged_spazer_wave_ice'] = renderers['charged_spazer_ice']

const beam_widths = {
  '': 8,
  charged_: 8,
  ice: 8,
  charged_ice: 8,

  wave: 8,
  charged_wave: 8,
  wave_ice: 8,
  charged_wave_ice: 8,

  spazer: 16,
  charged_spazer: 32,
  spazer_ice: 16,
  charged_spazer_ice: 32,

  spazer_wave: 16,
  charged_spazer_wave: 32,
  spazer_wave_ice: 16,
  charged_spazer_wave_ice: 32,

  plasma: 32,
  charged_plasma: 56,
  plasma_ice: 32,
  charged_plasma_ice: 56,

  plasma_wave: 32,
  charged_plasma_wave: 56,
  plasma_wave_ice: 32,
  charged_plasma_wave_ice: 56,

  plasma_spazer: 16,
  charged_plasma_spazer: 32,
  plasma_spazer_ice: 16,
  charged_plasma_spazer_ice: 32,

  plasma_spazer_wave: 16,
  charged_plasma_spazer_wave: 32,
  plasma_spazer_wave_ice: 16,
  charged_plasma_spazer_wave_ice: 32,
}

const variants = ['charged', ...BEAMS]

function getCombinations(valuesArray) {
  var combi = []
  var temp = []
  var slent = Math.pow(2, valuesArray.length)

  for (var i = 0; i < slent; i++) {
    temp = []
    for (var j = 0; j < valuesArray.length; j++) {
      if (i & Math.pow(2, j)) {
        temp.push(valuesArray[j])
      }
    }
    if (temp.length > 0) {
      combi.push(temp)
    }
  }

  return combi
}

const assert = (bool, error) => {
  if (!bool) {
    throw error
  }
}

getCombinations(variants).forEach((v) => {
  let key = v.join('_')
  if (key === 'charged') {
    key = 'charged_'
  }
  assert(renderers[key], 'missing:', key)
  assert(beam_widths[key], 'missing:', key)
})
