import OsdStore from '@/vue-openseadragon/Store'
import Openseadragon from 'openseadragon'

const { Point, Rect } = Openseadragon

export default (component) => {
  const osd_store = OsdStore()
  const { state } = osd_store
  state.filters = {}
  const raw_bounds = {
    zone: {},
    room: {},
  }

  osd_store.getWorldXY = (event) => {
    const { clientX, clientY } = event
    const box = component.$el.getBoundingClientRect()
    const pixel = new Point(clientX - box.x, clientY - box.y)
    const { x, y } = state._viewer.viewport.pointFromPixel(pixel)
    return [Math.floor(x), Math.floor(y)]
  }

  osd_store.dragZone = (zone, client_delta) => {
    raw_bounds.zone[zone.id] = raw_bounds.zone[zone.id] || zone.data.world.bounds.slice()
    osd_store.dragXY(zone.data.world.bounds, raw_bounds.zone[zone.id], client_delta)

    const _files = `${zone.slug}_files/`
    const items = state._viewer.world._items.filter((i) => i.source.tilesUrl?.includes(_files))
    const [x, y] = zone.data.world.bounds
    items.forEach((osd_item) => osd_item.setPosition(new Point(x, y), true))
  }

  osd_store.dragRoom = (room, client_delta) => {
    const { bounds } = room.data.zone
    raw_bounds.room[room.id] = raw_bounds.room[room.id] || bounds.slice()
    osd_store.dragXY(bounds, raw_bounds.room[room.id], client_delta)
  }

  osd_store.dragXY = (xy, raw_xy, client_delta) => {
    const [raw_x, raw_y] = raw_xy
    const old_point = new Point(raw_x, raw_y)

    const new_pixel = state._viewer.viewport.pixelFromPoint(old_point)
    new_pixel.x += client_delta[0]
    new_pixel.y += client_delta[1]
    const new_point = state._viewer.viewport.pointFromPixel(new_pixel)
    raw_xy[0] = new_point.x
    raw_xy[1] = new_point.y

    Object.assign(
      xy,
      raw_xy.map((i) => Math.floor(i)),
    )
  }

  osd_store._gotoBounds = (bounds) => {
    const [x, y, w, h] = bounds
    const b = 1
    state._viewer.viewport.fitBounds(new Rect(x - b, y - b, w + 2 * b, h + 2 * b))
  }

  osd_store.gotoItem = (item, map_bounds) => {
    osd_store._gotoBounds(map_bounds.room_bounds[item.room])

    const f = () => component.$store.route.selectItem(item)
    const timeout = setTimeout(f, 100)
    state._viewer.addOnceHandler('animation-finish', f)
    state._viewer.addOnceHandler('animation-start', () => clearTimeout(timeout))
  }

  osd_store.gotoRoom = (room, map_bounds) => {
    osd_store._gotoBounds(map_bounds.room_bounds[room.id])
  }

  return osd_store
}
