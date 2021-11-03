// TODO this file was split into vue-openseadragon/Store to make osd stores on demand
// Need to update old map editor to use new Store
import { reactive, markRaw } from 'vue'
import OpenSeadragon from 'openseadragon'

const { Point } = OpenSeadragon

export default ({ _store }) => {
  const state = reactive({ _viewer: null })

  return {
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
  }
}
