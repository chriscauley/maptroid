import OsdStore from '@/vue-openseadragon/Store'
import Openseadragon from 'openseadragon'

const { Point } = Openseadragon

export default (_component) => {
  const osd_store = OsdStore()
  const { state } = osd_store

  osd_store.dragRoom = (room, client_delta) => {
    const [raw_x, raw_y] = room.data.zone.raw
    const old_point = new Point(raw_x, raw_y)

    const new_pixel = state._viewer.viewport.pixelFromPoint(old_point)
    new_pixel.x += client_delta[0]
    new_pixel.y += client_delta[1]
    const new_point = state._viewer.viewport.pointFromPixel(new_pixel)
    room.data.zone.raw[0] = new_point.x
    room.data.zone.raw[1] = new_point.y

    room.data.zone.bounds = room.data.zone.raw.map((i) => Math.floor(i))
  }

  return osd_store
}
