// Taken from p2.js/examples/canvas/js/KinematicCharacterController.js

import { POSTURE, CHARGE_TIME } from '../constants'
import SpriteSheet from '@/views/SpriteSheet/store'
import { getAsset } from '../useAssets'

// animation helper
const getFrame = (time, count, factor = 1) => {
  const duration = (count * factor * 1000) / 24
  return parseInt((count * (time % duration)) / duration)
}

const _poses = {
  zenith: 1,
  upward: 2,
  downward: 3,
  down: 3, // TODO need to be able to shoot down from stainding
}

const _getSprite = (player) => {
  const now = player.getNow()
  const { pointing, posture } = player.state
  const dir = player.collisions.faceDir === -1 ? '_left' : '_right'
  player._show_charge = false
  if (player.collisions.turn_for >= 0) {
    let index = Math.floor(player.collisions.turn_for / 2)
    if (player.collisions.turning === 1) {
      index = 4 - index
    }
    const pose = `turn_${posture === POSTURE.crouch ? 'crouch' : 'stand'}ing`
    return [pose, index]
  }
  if (posture === POSTURE.ball) {
    return ['ball' + dir, getFrame(now, 8)]
  } else if (posture === POSTURE.crouch) {
    player._show_charge = true
    if (pointing === 'zenith') {
      return ['_poses' + dir, 4]
    } else if (pointing === 'upward') {
      return ['_poses' + dir, 5]
    } else if (pointing === 'downward') {
      return ['_poses' + dir, 6]
    } else if (pointing === 'down') {
      return ['_poses' + dir, 8]
    }

    // crouching + breathing
    const frame = getFrame(now, 3)
    return ['crouch' + dir, frame]
  }
  if (player.collisions.below) {
    // on ground
    if (Math.abs(player._lastX - player.body.position[0]) < 0.01) { // TODO player.state.moved_x(?)
      player._show_charge = true
      // not moving
      if (pointing) {
        return ['_poses' + dir, _poses[pointing]]
      }

      // standing + breathing
      const frame = getFrame(now, 3, 9)
      return ['stand' + dir, frame]
    } else {
      // running
      player._show_charge = true
      let aim = ''
      if (pointing === 'zenith') {
        // TODO this is just not allowed in vanilla so I need to make a sprite for it
      } else if (pointing === 'upward') {
        aim = '_aimup'
      } else if (pointing === 'downward') {
        aim = '_aimdown'
      } else if (player.keys['shoot1'] || player.keys['shoot2']) {
        aim = '_aim'
      } else if (pointing === 'down') {
        // TODO Vanilla only has shoot down while jumping
      }

      const frame = getFrame(now, 10)
      return ['walk' + aim + dir, frame]
    }
  } else {
    if (posture === POSTURE.spin) {
      const frame = getFrame(now, 8)
      return ['spinjump' + dir, frame]
    }
    if (pointing === 'downward') {
      player._show_charge = true
      return ['jump_aimdown' + dir, 3]
    } else if (pointing === 'upward') {
      player._show_charge = true
      return ['jump_aimup' + dir, 3]
    } else if (pointing === 'down') {
      player._show_charge = true
      return ['_poses' + dir, 8]
    } else if (pointing === 'zenith') {
      player._show_charge = true
      return ['_poses' + dir, 9]
    }
    // in air
    return ['falling' + dir, 2]
  }
  return ['crouch_left', 0]
}

const shoots = ['shoot1', 'shoot2']

const getChargeSprite = (player, key) => {
  const weapon = player.loadout[key]
  weapon.is_charged = false
  if (!player.loadout[key].canCharge() || !player.keys[key]) {
    return undefined
  }
  const dt = player.getNow() - player._last_pressed_at[key]
  const charge_level = Math.floor((4 * dt) / CHARGE_TIME)
  if (charge_level == 0) {
    return undefined
  }
  const frame_no = Math.floor(dt / 60) // how many frames have we been charging for
  weapon.is_charged = charge_level >= 4
  const cycle_no = Math.floor(frame_no / 4) % 2 // 0 or 1, switching every 4 frames
  const y = player.loadout[key]['ice-beam'] ? 0 : 1
  const x = Math.min(charge_level, 4) - 1 + cycle_no
  const { img } = getAsset('charge-beam')

  return { img, sx: x * 16, sy: y * 16, sh: 16, sw: 16, frame_no, weapon }
}

const whiten = (img, number) => {
  const key = `__whiten__${number}`
  if (!img[key]) {
    const canvas = (img[key] = document.createElement('canvas'))
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const idata = ctx.getImageData(0, 0, img.width, img.height)
    const data = idata.data
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3]) {
        // alpha channel is not zero
        // add number to r, g, b channels
        data[i] += number
        data[i + 1] += number
        data[i + 2] += number
      }
    }
    ctx.putImageData(idata, 0, 0)
    document.body.appendChild(canvas)
  }
  return img[key]
}

export default (player, ctx) => {
  const _ise = ctx.imageSmoothingEnabled
  ctx.imageSmoothingEnabled = false
  const { _width, height } = player.body.shapes[0]
  const [name, frame] = _getSprite(player)
  const spritesheet = SpriteSheet('power-suit')
  const { img, sx, sy, sw, sh, offset_x, center } = spritesheet.getAnimationParams(
    name,
    frame,
    true,
  )
  const dw = sw / 16
  const dh = sh / 16
  const base_x = -offset_x / 16
  let base_y = -height / 2
  if (center) {
    base_y = -sh / 16 / 2
  }

  const { position } = player.aim
  const charge_sprite = shoots.map((key) => getChargeSprite(player, key)).find(Boolean)

  if (charge_sprite) {
    const { frame_no, weapon } = charge_sprite
    if (weapon.is_charged) {
      const charge_image = whiten(img, ((frame_no % 4) + 1) * 30)
      ctx.save()
      ctx.drawImage(charge_image, sx, sy, sw, sh, base_x, base_y, dw, dh)
      ctx.restore()
    } else {
      ctx.drawImage(img, sx, sy, sw, sh, base_x, base_y, dw, dh)
    }

    if (player._show_charge) {
      const { img, sx, sy, sh, sw } = charge_sprite
      const dw = sw / 16
      const dh = sh / 16
      ctx.drawImage(img, sx, sy, sw, sh, position[0] - dw / 2, position[1] - dh / 2, dw, dh)
    }
  } else {
    ctx.drawImage(img, sx, sy, sw, sh, base_x, base_y, dw, dh)
  }

  // TODO draw gun with debug enabled
  // ctx.beginPath()
  // ctx.arc(position[0], position[1], 0.1, 0, 2 * Math.PI)
  // ctx.arc(player.body.position[0], player.body.position[1], 0.1, 0, 2 * Math.PI)
  // ctx.fill()

  ctx.imageSmoothingEnabled = _ise
}
