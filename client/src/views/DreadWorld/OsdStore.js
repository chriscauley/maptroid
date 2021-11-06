import OsdStore from '@/vue-openseadragon/Store'
import Openseadragon from 'openseadragon'

const { Point } = Openseadragon

export default (_component) => {
  const osd_store = OsdStore()
  const { state } = osd_store

  // This is somewhat arbitrary. Based on Ghavoran ~200px in world screenshot
  // and is ~11 zoomed screenshots wide
  const screenshotToZoneRatio = (number) => (number * 200) / (11 * 1280)
  const screenshotToZonePercent = (number) => `${100 * screenshotToZoneRatio(number)}%`

  // TODO this is general enough to make it back into vue-openseadragon
  const addClientDeltaToViewport = (client_delta, viewport_xy) => {
    const old_point = new Point(...viewport_xy)
    const new_pixel = state._viewer.viewport.pixelFromPoint(old_point)
    new_pixel.x += client_delta[0]
    new_pixel.y += client_delta[1]
    const new_point = state._viewer.viewport.pointFromPixel(new_pixel)
    return [new_point.x, new_point.y]
  }

  const dragZone = (zone, event) => {
    const { center_xy } = zone.data.world
    const { last_dxy } = event._drag
    zone.data.world.center_xy = osd_store.addClientDeltaToViewport(last_dxy, center_xy)
  }

  Object.assign(osd_store, {
    screenshotToZoneRatio,
    screenshotToZonePercent,
    addClientDeltaToViewport,
    dragZone,
  })

  return osd_store
}
