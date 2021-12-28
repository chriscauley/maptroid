// Taken from p2.js/examples/canvas/js/KinematicCharacterController.js
import { POSTURE } from '../constants'

const range = 6 // TODO range should vary by beam
const starts = [0, 0.3333333, 0.6666666] // TODO dependant on beam having a "spazer"

const anglesByPointing = {
  // relative to zenith
  zenith: 0,
  down: Math.PI,
  upward: Math.PI / 4,
  downward: (3 * Math.PI) / 4,
  undefined: Math.PI / 2,
}

const getArmOffset = (player) => {
  if (player.state.pointing === undefined) {
    return player.state.posture === POSTURE.stand ? 3 / 16 : -0.5 + 1 / 16
  }
  return player.state.posture === POSTURE.stand ? 0.6 : 0.3
}

const getSpreadOffsets = (player) => {
  // When facing forward a beam spreads slightly up and slightly down
  // this returns [slightly_up_dxy, slightly_down_dxy] which varies by gun angle
  // I had trouble getting the trig just right for upward/downward spreads so I hard coded it
  const pointing = player.state.pointing
  const faceDir = player.collisions.faceDir
  const s = 0.13
  const s2 = Math.cos(Math.PI / 4) * s
  if (['zenith', 'down'].includes(player.state.pointing)) {
    return [
      [s, 0],
      [-s, 0],
    ]
  } else if (player.state.pointing === undefined) {
    return [
      [0, s],
      [0, -s],
    ]
  }
  if ((faceDir === -1 && pointing === 'upward') || (faceDir === 1 && pointing === 'downward')) {
    // getting the trig to get this pattern of [[-,-],[+,}]] and [[+,-],[-,+]] was tricky
    return [
      [-s2, -s2],
      [s2, s2],
    ]
  }
  return [
    [s2, -s2],
    [-s2, s2],
  ]
}

export default (function() {
  // NOTE: this cache saves about 5 us per call... delete it if it causes problems
  const cache = {}

  return (player, _origin) => {
    const { pointing } = player.state
    const key = `${pointing}.${player.state.posture}.${player.collisions.faceDir}.${_origin}`
    if (!cache[key]) {
      const angle = player.collisions.faceDir * anglesByPointing[pointing]
      const arm_offset = getArmOffset(player)
      // const [x_offset, y_offset] = [0.1*Math.cos(angle), 0.1*Math.sin(angle)]
      const x_shift = Math.sin(angle) * range
      const y_shift = Math.cos(angle) * range
      cache[key] = []
      starts.forEach((start, i_start) => {
        const _i = 2 * i_start + 1
        getSpreadOffsets(player).forEach(([x_offset, y_offset]) =>
          cache[key].push([
            [x_shift * start + x_offset * _i, y_shift * start + y_offset * _i + arm_offset],
            [x_shift + x_offset * _i, y_shift + arm_offset + y_offset * _i],
          ]),
        )
      })
    }
    return cache[key]
  }
})()
