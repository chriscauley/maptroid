// function for figuring out where the tip of the gun is and direction of aim

import { vec2 } from 'p2'

import { POSTURE } from '../constants'

const root2over2 = Math.sqrt(2) / 2

export default (player) => {
  const position = vec2.create()
  position[1] = player.body.shapes[0].height / 2
  const dx = player.collisions.faceDir
  const dxy = [dx, 0]

  const { pointing } = player.state
  if (pointing === 'down') {
    dxy[1] = -1
    dxy[0] = 0
    position[0] += 0.1
    position[1] -= 1
  } else if (pointing === 'zenith') {
    dxy[0] = 0
    dxy[1] = 1
    position[0] += dx * 0.05
    position[1] += 0.8
  } else if (pointing === 'upward') {
    dxy[0] *= root2over2
    dxy[1] = root2over2
    position[1] += 0.35
    position[0] += 1.2 * dx
    if (player.state.posture === POSTURE.crouch) {
      position[1] += 0.05
    }
  } else if (pointing === 'downward') {
    dxy[0] *= root2over2
    dxy[1] = -root2over2
    position[1] -= 1.5
    position[0] += 1 * dx
    if (player.state.posture === POSTURE.crouch) {
      position[1] += 0.1
    }
  } else {
    // pointing === null
    if (Math.abs(player.scaledVelocity[0]) < 0.1) {
      // TODO player.state.is_running
      // standing still
      position[1] -= 1
      position[0] += 1 * dx
      if (player.state.posture === POSTURE.crouch) {
        position[1] += 0.1
      }
    } else {
      // running
      position[1] -= 0.8
      position[0] += 1.1 * dx
    }
  }

  return { position, dxy }
}
