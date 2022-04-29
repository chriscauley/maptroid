import { vec2 } from 'p2'

import { POSTURE } from '../constants'

const root2over2 = Math.sqrt(2) / 2

export default (player) => {
  const { width, height } = player.body.shapes[0]
  const position = vec2.create()
  position[1] = height / 2
  const dx = player.collisions.faceDir
  const dxy = [dx, 0]

  const { pointing } = player.state
  if (pointing === 'down') {
    dxy[1] = -1
    dxy[0] = 0
    position[1] -= 1.4
  } else if (pointing === 'zenith') {
    dxy[0] = 0
    dxy[1] = 1
    position[0] += dx * 0.05
    position[1] += 0.6
  } else if (pointing === 'upward') {
    dxy[0] *= root2over2
    dxy[1] = root2over2
    position[1] += 0.2
    position[0] += 2.1 * dx * width
  } else if (pointing === 'downward') {
    dxy[0] *= root2over2
    dxy[1] = -root2over2
    position[1] -= 1.4
    position[0] += 1.8 * dx * width
    if (player.state.posture === POSTURE.crouch) {
      position[1] += 0.1
    }
  } else {
    // pointing === null
    if (Math.abs(player.scaledVelocity[0]) < 0.1) {
      // running
      position[1] -= 1
      position[0] += 1.5 * dx * width
      if (player.state.posture === POSTURE.crouch) {
        position[1] += 0.1
      }
    } else {
      // standing still
      position[1] -= 0.8
      position[0] += 2.2 * dx * width
    }
  }

  return { position, dxy }
}
