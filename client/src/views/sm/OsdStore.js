import OsdStore from '@/vue-openseadragon/Store'
import Openseadragon from 'openseadragon'

const { Point } = Openseadragon

export default (component) => {
  const osd_store = OsdStore()
  const { state } = osd_store
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

    const tilesUrl = zone.data.dzi.slice(0, -4) + '_files/'
    const osd_item = state._viewer.world._items.find((i) => tilesUrl === i.source.tilesUrl)
    const [x, y] = zone.data.world.bounds
    osd_item.setPosition(new Point(x, y), true)
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

  return osd_store
}
