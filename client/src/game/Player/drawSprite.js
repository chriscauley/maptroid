import { POSTURE, CHARGE_FRAMES } from '../constants'
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
  wall_sliding: 13,
  push_off: 15,
  pre_spin: 16,
}

const _getSprite = (player) => {
  const now = player.getNow()
  const { pointing, posture } = player.state
  const dir = player.collisions.faceDir === -1 ? '_left' : '_right'
  player._show_charge = false

  if (player.collisions.is_wall_sliding) {
    return ['_poses' + dir, _poses.wall_sliding]
  }

  if (player.collisions.turn_for >= 0) {
    let index = Math.floor(player.collisions.turn_for / 2)
    if (player.collisions.turning === 1) {
      index = 4 - index
    }
    const pose = `turn_${posture === POSTURE.crouch ? 'crouch' : 'stand'}ing`
    return [pose, index]
  }
  if (posture === POSTURE.ball) {
    const balling = Math.floor(player.state.balling / 4)
    if (balling > 1) {
      return ['morphing' + dir, 0]
    } else if (balling === 1) {
      return ['morphing' + dir, 1]
    }
    return ['ball' + dir, getFrame(now, 8)]
  } else if (posture === POSTURE.crouch) {
    player._show_charge = true
    if (player.collisions.below) {
      const crouching = Math.floor(player.state.crouching / 3)
      if (crouching > 0) {
        return ['_poses' + dir, 14]
      }
    }
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
    if (Math.abs(player._lastX - player.body.position[0]) < 0.01) {
      // TODO player.state.moved_x(?)
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
      let frame = getFrame(now, 8)
      // check if player is pushing off wall
      if (player._last_wall_jump_frame) {
        if (player.state.input[0] !== -player._last_wall_jump_direction) {
          // player has not changed directions
          const frames_since_slide = player.game.frame - player._last_wall_jump_frame
          if (frames_since_slide < 2) {
            return ['_poses' + dir, _poses.wall_sliding]
          } else if (frames_since_slide < 7) {
            return ['_poses' + dir, _poses.push_off]
          } else if (frames_since_slide < 12) {
            return ['_poses' + dir, _poses.pre_spin]
          }
          frame = (frames_since_slide - 12) % 8
        }
      }

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
  const dframe = player.game.frame - player._last_pressed_at[key]
  const charge_level = Math.floor((4 * dframe) / CHARGE_FRAMES)
  if (charge_level == 0) {
    return undefined
  }
  weapon.is_charged = charge_level >= 4
  const cycle_no = Math.floor(dframe / 4) % 2 // 0 or 1, switching every 4 frames
  const y = player.loadout[key]['ice-beam'] ? 0 : 1
  const x = Math.min(charge_level, 4) - 1 + cycle_no
  const { img } = getAsset('charge-beam')

  return { img, sx: x * 16, sy: y * 16, sh: 16, sw: 16, dframe, weapon }
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
  }
  return img[key]
}

const bluetify = (img) => {
  const key = `__bluetify`
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
        data[i] += 0
        data[i + 1] += 120
        data[i + 2] += 165
      }
    }
    ctx.putImageData(idata, 0, 0)
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

  if (player.state.speeding) {
    const speed_image = bluetify(img)
    ctx.drawImage(speed_image, sx, sy, sw, sh, base_x, base_y, dw, dh)
    const [x, y] = player.body.position
    let tick = 8
    player.game.animations.push(() => {
      tick--
      if (tick % 4 === 0) {
        ctx.save()
        ctx.translate(x, y)
        ctx.drawImage(speed_image, sx, sy, sw, sh, base_x, base_y, dw, dh)
        ctx.restore()
      }
      return tick > 0
    })
  } else if (charge_sprite) {
    const { dframe, weapon } = charge_sprite
    if (weapon.is_charged) {
      const charge_image = whiten(img, ((dframe % 4) + 1) * 30)
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
  ctx.beginPath()
  ctx.arc(position[0], position[1], 0.1, 0, 2 * Math.PI)
  ctx.arc(player.body.position[0], player.body.position[1], 0.1, 0, 2 * Math.PI)
  ctx.fill()

  ctx.imageSmoothingEnabled = _ise
}
