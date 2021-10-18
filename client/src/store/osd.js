// TODO I'm moving generic OSD stuff out of the viewer store and into here
// viewer store will most likely become app or editor or something generic like that
import { reactive, markRaw } from 'vue'
import OpenSeadragon from 'openseadragon'

const { Point } = (window.OSD = OpenSeadragon)

export default () => {
  const state = reactive({ _viewer: null })

  const osd_store = {
    state,
    patch: (data) => Object.assign(state, data),
    // this makes the viewer more accessible and marks it raw
    get viewer() {
      return state._viewer
    },
    set viewer(viewer) {
      // TODO everything except state._viewer=viewer is unecessary as the viewer has methods to get these
      let px = { x: 1, y: 1 }
      let size = px
      if (viewer) {
        const p = new Point(1, 1)
        px = viewer.viewport.imageToViewportCoordinates(p)
        size = viewer.world.getItemAt(0)?.getContentSize() || px
      }
      Object.assign(state, {
        _viewer: viewer ? markRaw(viewer) : viewer,
        px_width: px.x,
        px_height: px.y,
        content_width: size.x,
        content_height: size.y,
      })
    },
    addImage(image) {
      if (!state.contentFactor) {
        state.contentFactor = state._viewer.world._contentFactor
      }
      const osd_item = state._viewer.world._items.find((i) => image.src === i.source.url)
      if (osd_item) {
        return
      }
      if (image.data._world === undefined) {
        image.data._world = { x: 0, y: 0, width: 1 }
      }
      const { x, y, width } = image.data._world
      state._viewer.addSimpleImage({ url: image.src, x, y, width, opacity: 0.5 })
    },
    moveImage(image, client_delta) {
      const osd_item = state._viewer.world._items.find((i) => image.src === i.source.url)
      const pixel = osd_item.viewport.pixelFromPoint(
        new Point(image.data._world.x, image.data._world.y),
      )
      pixel.x += client_delta.x
      pixel.y += client_delta.y
      const point = osd_item.viewport.pointFromPixel(pixel)
      osd_item.setPosition(point, true)
      image.data._world.x = point.x
      image.data._world.y = point.y
      console.warn('TODO debounced save image')
    },
  }

  return osd_store
}
