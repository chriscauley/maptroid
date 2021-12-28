import { cloneDeep } from 'lodash'

export const fromString = (string, options = {}) => {
  const room = cloneDeep(options)
  room.json = {
    bricks: [],
    static_boxes: [],
  }
  const rows = string.trim().split('\n')
  rows.forEach((row, y) => {
    y = -y
    row.split('').forEach((s, x) => {
      if (s === 'S') {
        room.json.start = [x, y]
      } else if (s === '0') {
        room.json.static_boxes.push({ x, y, width: 1, height: 1 })
      } else if (s === '1') {
        room.json.bricks.push({ x, y, type: 'moss' })
      } else if (s === ' ' || s === '_') {
        return
      } else {
        throw 'Unrecognized brick: ' + s
      }
    })
  })

  return room
}
