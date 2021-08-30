import fields from './fields'

const _schema = {
  type: 'object',
  properties: {
    xys: fields.xy,
    name: { type: 'string' },
    area: { type: 'string' },
  },
}

const vec = {
  equal: (xy1, xy2) => xy1[0] === xy2[0] && xy1[1] === xy2[1],
}

const Room = {
  _schema,
  containsXY(room, xy) {
    return room.xys.find((xy2) => vec.equal(xy, xy2))
  },
  getBounds(room) {
    const xs = room.xys.map((xy) => xy[0])
    const ys = room.xys.map((xy) => xy[1])
    const x1 = Math.min(...xs)
    const y1 = Math.min(...ys)
    const x2 = Math.max(...xs)
    const y2 = Math.max(...ys)
    return [x1, y1, x2 - x1 + 1, y2 - y1 + 1]
  },
  getMapBounds(room) {
    return Room.getBounds(room).map((i) => i * 256)
  },
  makeRoom(room, { map_style = 'off', onClick, selected }) {
    if (map_style === 'off') {
      return []
    }
    const { area } = room
    const xy2i = (xy) => xy[0] + xy[1] * 66
    const _xys = {}
    room.xys.forEach((xy) => {
      _xys[xy2i(xy)] = true
    })
    return room.xys.map(([x, y]) => {
      return {
        id: `screen-${x}_${y}`,
        title: `#${room.id} ${room.name}`,
        x,
        y,
        onClick,
        class: [
          `sm-room -absolute -${area} -style-${map_style}`,
          {
            br0: _xys[xy2i([x + 1, y])],
            bl0: _xys[xy2i([x - 1, y])],
            bb0: _xys[xy2i([x, y + 1])],
            bt0: _xys[xy2i([x, y - 1])],
            '-selected': selected,
          },
        ],
      }
    })
  },
}

export default Room
