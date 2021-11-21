<template>
  <open-seadragon
    @mousewheel.prevent="osdWheel"
    :options="osd_options"
    :callback="callback"
    :pixelated="true"
  />
</template>

<script>
import Openseadragon from 'openseadragon'

export default {
  props: {
    osd_store: Object,
  },
  emits: ['viewer-bound'],
  data() {
    const is_editor = !!this.$auth.user?.is_superuser
    const osd_options = {
      maxZoomPixelRatio: is_editor ? 8 : 4,
      navigatorAutoFade: false,
      showNavigator: true,
      showZoomControl: false,
      showHomeControl: false,
      showFullPageControl: false,
      showRotationControl: false,
      debugmode: false,
      clickTimeThreshold: 1000,
      mouseNavEnabled: !is_editor,
      gestureSettingsMouse: {
        clickToZoom: false,
        dblClickToZoom: false,
      },
    }
    return { osd_options }
  },
  computed: {
    is_editor() {
      return !!this.$auth.user?.is_superuser
    },
  },
  watch: {
    is_editor() {
      const { viewer } = this.osd_store
      // TODO is this a race condition against the viewer loading in time?
      viewer.setMouseNavEnabled(!this.is_editor)
      viewer.viewport.maxZoomPixelRatio = this.is_editor ? 8 : 4
    },
  },
  methods: {
    osdWheel(event) {
      if (!this.is_editor) {
        return
      }
      // Loosely adapted from Openseadragon.Viewer's onCanvasDragEnd onCanvasScroll
      const viewer = this.osd_store.viewer
      const viewport = viewer.viewport
      if (event.ctrlKey) {
        const box = viewer.container.getBoundingClientRect()
        const position = new Openseadragon.Point(event.pageX - box.left, event.pageY - box.top)
        const factor = Math.pow(viewer.zoomPerScroll, -event.deltaY / 20)
        viewport.zoomBy(factor, viewport.pointFromPixel(position, true))
      } else {
        const center = viewport.pixelFromPoint(viewport.getCenter(true))
        const target = viewport.pointFromPixel(
          new Openseadragon.Point(center.x + 3 * event.deltaX, center.y + 3 * event.deltaY),
        )
        viewport.panTo(target, false)
      }
      viewport.applyConstraints()
    },
    callback(viewer) {
      this.osd_store.bindViewer(viewer)
      this.$emit('viewer-bound', viewer)
    },
  },
}
</script>
