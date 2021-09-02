const add = (xy1, xy2) => [xy1[0] + xy2[0], xy1[1] + xy2[1]]
const isEqual = (xy1, xy2) => xy1[0] === xy2[0] && xy1[1] === xy2[1]

export default {
  dxyByName: {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
  },
  add,
  isEqual,
}
