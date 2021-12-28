export const add = (xy1, xy2) => [xy1[0] + xy2[0], xy1[1] + xy2[1]]
export const subtract = (xy1, xy2) => [xy1[0] - xy2[0], xy1[1] - xy2[1]]
export const scale = (xy, s) => [xy[0] * s, xy[1] * s]

const _round = (n, amount) => Math.round(n / amount) * amount
export const round = (xy, amount = 1) => [_round(xy[0], amount), _round(xy[1], amount)]

const _floor = (n, amount) => Math.floor(n / amount) * amount
export const floor = (xy, amount = 1) => [_floor(xy[0], amount), _floor(xy[1], amount)]

export const slope = (xys) => {
  const riserun = subtract(xys[1], xys[0])
  return riserun[1] / riserun[0]
}

export default {
  add,
  subtract,
  floor,
  scale,
  slope,
  round,
}
