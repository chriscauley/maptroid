// TODO I'm moving generic OSD stuff out of the viewer store and into here
// viewer store will most likely become app or editor or something generic like that
import { reactive, markRaw } from 'vue'
import OpenSeadragon from 'openseadragon'

export default () => {
  const state = reactive({
    _viewer: null,
    width: null,
    height: null,
  })

  const osd_store = {
    state,
    patch: (data) => Object.assign(state, data),
    // this makes the viewer more accessible and marks it raw
    get viewer() {
      return state._viewer
    },
    set viewer(viewer) {
      const p = new OpenSeadragon.Point(1, 1)
      const px = viewer.viewport.imageToViewportCoordinates(p)
      const size = viewer.world.getItemAt(0).getContentSize()

      Object.assign(state, {
        _viewer: markRaw(viewer),
        px_width: px.x,
        px_height: px.y,
        content_width: size.x,
        content_height: size.y,
      })
    },
  }

  return osd_store
}
