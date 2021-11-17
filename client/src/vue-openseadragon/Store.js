// TODO I'm moving generic OSD stuff out of the viewer store and into here
// viewer store will most likely become app or editor or something generic like that
import { reactive, markRaw } from 'vue'

export default () => {
  const state = reactive({ _viewer: null })

  return {
    state,
    patch: (data) => Object.assign(state, data),
    // this makes the viewer more accessible and marks it raw
    get viewer() {
      return state._viewer
    },
    set viewer(viewer) {
      state._viewer = viewer ? markRaw(viewer) : viewer
    },
    bindViewer(viewer) {
      state._viewer = viewer
      viewer.addHandler('zoom', () => (state.zoom = viewer.viewport.getZoom()))
    },
  }
}
