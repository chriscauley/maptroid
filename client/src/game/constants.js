export const SCENERY_GROUP = Math.pow(2, 1)
export const BULLET_GROUP = Math.pow(2, 2)
export const PLAYER_GROUP = Math.pow(2, 3)

export const DIRECTIONS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

export const DXYS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

export const PLAYER_ACTIONS = [
  'up',
  'down',
  'left',
  'right',
  'shoot1',
  'shoot2',
  'jump',
  'run',
  'aimup',
  'aimdown',
  'pause',
]

export const POSTURE = {
  ball: 0,
  crouch: 1,
  stand: 2,
  spin: 3,
  _heights: [14 / 16, 30 / 16, 42 / 16, 24 / 16],
}
