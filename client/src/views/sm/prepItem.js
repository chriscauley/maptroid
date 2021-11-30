import { startCase } from 'lodash'

export default (item, room) => {
  let style
  if (room) {
    const [x, y] = item.data.room_xy
    const width = room.data.zone.bounds[2] * 16
    const height = room.data.zone.bounds[3] * 16
    style = {
      top: `${(100 * y) / height}%`,
      left: `${(100 * x) / width}%`,
      height: `${100 / height}%`,
      width: `${100 / width}%`,
    }
  }
  return {
    id: `sm-item__${item.id}`,
    class: `sm-item -${item.data.type}`,
    title: startCase(item.data.type),
    style,
  }
}
