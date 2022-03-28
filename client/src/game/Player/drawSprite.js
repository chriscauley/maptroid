// Taken from p2.js/examples/canvas/js/KinematicCharacterController.js

import { POSTURE } from '../constants'
import PowerSuit from '@/views/PowerSuit/store'

// animation helper
const getFrame = (time, count, duration) => {
  return parseInt((count * (time % duration)) / duration)
}

const _getSprite = (player) => {
  const { pointing } = player.state
  const breath_time = 16700 / 20
  const [dx, _dy] = player.scaledVelocity
  const dir = player.collisions.faceDir === -1 ? 'left' : 'right'
  if (player.state.posture === POSTURE.ball) {
    return ['ball_' + dir, getFrame(new Date().valueOf(), 8, 24000 / 30)]
  } else if (player.state.posture === POSTURE.crouch) {
    if (pointing === 'zenith') {
      return ['_poses_' + dir, 4]
    } else if (pointing === 'upward') {
      return ['_poses_' + dir, 5]
    } else if (pointing === 'downward') {
      return ['_poses_' + dir, 6]
    }
    const frame = getFrame(new Date().valueOf(), 3, breath_time)
    return ['crouch_' + dir, frame]
  }
  if (player.collisions.below) {
    // on ground
    if (Math.abs(dx) < 0.1) {
      if (pointing === 'zenith') {
        return ['_poses_' + dir, 1]
      } else if (pointing === 'upward') {
        return ['_poses_' + dir, 2]
      } else if (pointing === 'downward') {
        return ['_poses_' + dir, 3]
      } else if (pointing === 'down') {
        // TODO need to be able to shoot down from stainging
      }
      const frame = getFrame(new Date().valueOf(), 3, breath_time)
      return ['stand' + '_' + dir, frame]
    } else {
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

      const cycle_time = 500
      const frame = getFrame(new Date().valueOf(), 10, cycle_time)
      return ['walk' + aim + '_' + dir, frame]
    }
  }
  return ['crouch_left', 0]
}

export default (player, ctx) => {
  const _ise = ctx.imageSmoothingEnabled
  ctx.imageSmoothingEnabled = false
  const { _width, height } = player.body.shapes[0]
  const [name, frame] = _getSprite(player)
  const { img, sx, sy, sw, sh, offset_x } = PowerSuit.getAnimationParams(name, frame, true)
  const dw = sw / 16
  const dh = sh / 16
  const base_y = -height / 2
  const base_x = -offset_x / 16
  ctx.drawImage(img, sx, sy, sw, sh, base_x, base_y, dw, dh)
  ctx.imageSmoothingEnabled = _ise
}
