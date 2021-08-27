const Room = {
  getBounds(room, world) {
    const max = {
      x: 0,
      y: 0,
    }
    const min = {
      x: Infinity,
      y: Infinity,
    }
    room.indexes.forEach((index) => {
      const [x, y] = world.geo.index2xy(index)
      max.x = Math.max(x, max.x)
      min.x = Math.min(x, min.x)
      max.y = Math.max(y, max.y)
      min.y = Math.min(y, min.y)
    })
    return [min.x, min.y, max.x - min.x + 1, max.y - min.y + 1]
  },
  getMapBounds(room, world) {
    return Room.getBounds(room, world).map((i) => i * 256)
  },
}

export default Room
