// Taken from p2.js/examples/canvas/js/KinematicCharacterController.js

import { POSTURE } from '../constants'
import SpriteSheet from '@/views/SpriteSheet/store'

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
  const [dx, _dy] = player.scaledVelocity
  const dir = player.collisions.faceDir === -1 ? '_left' : '_right'
  if (posture === POSTURE.ball) {
    return ['ball' + dir, getFrame(now, 8)]
  } else if (posture === POSTURE.crouch) {
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
    if (Math.abs(dx) < 0.1) {
      // not moving
      if (pointing) {
        return ['_poses' + dir, _poses[pointing]]
      }

      // standing + breathing
      const frame = getFrame(now, 3, 9)
      return ['stand' + dir, frame]
    } else {
      // running
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
      return ['jump_aimdown' + dir, 3]
    } else if (pointing === 'upward') {
      return ['jump_aimup' + dir, 3]
    } else if (pointing === 'down') {
      return ['_poses' + dir, 8]
    } else if (pointing === 'zenith') {
      return ['_poses' + dir, 9]
    }
    // in air
    return ['falling' + dir, 2]
  }
  return ['crouch_left', 0]
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
  ctx.drawImage(img, sx, sy, sw, sh, base_x, base_y, dw, dh)

  const { position } = player.aim
  ctx.beginPath()
  ctx.arc(position[0], position[1], 0.1, 0, 2 * Math.PI)
  ctx.arc(player.body.position[0], player.body.position[1], 0.1, 0, 2 * Math.PI)
  ctx.fill()

  ctx.imageSmoothingEnabled = _ise
}
