import { startCase } from 'lodash'

export default (item, map_props, matched = {}) => {
  let style
  if (map_props) {
    const [room_x, room_y] = map_props.room_offsets[item.room]
    const [x, y] = item.data.room_xy
    style = {
      left: `${100 * (x / 16 + room_x)}%`,
      top: `${100 * (y / 16 + room_y)}%`,
      width: `${100 / 16}%`,
      height: `${100 / 16}%`,
    }
  }
  return {
    id: `sm-item__${item.id}`,
    class: [`sm-item -${item.data.type}`, matched[item.id] ? '-matched' : '-not-matched'],
    title: startCase(item.data.type),
    style,
  }
}
