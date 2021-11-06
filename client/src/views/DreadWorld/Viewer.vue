<template>
  <open-seadragon
    @mousewheel.prevent="osdWheel"
    :options="osd_options"
    :callback="bindViewer"
    class="dread-world-viewer"
    :pixelated="true"
  />
</template>

<script>
export default {
  props: {
    zones: Array,
    osd_store: Object,
  },
  computed: {
    osd_options() {
      return {
        maxZoomPixelRatio: 8,
        showNavigator: true,
        showZoomControl: false,
        showHomeControl: false,
        showFullPageControl: false,
        showRotationControl: false,
        debugmode: false,
        clickTimeThreshold: 1000,
        mouseNavEnabled: false,
        visibilityRatio: 1,
        gestureSettingsMouse: {
          clickToZoom: false,
          dblClickToZoom: false,
        },
      }
    },
  },
  methods: {
    osdWheel(event) {
      // TODO copied from Dread/Viewer.vue
      // Loosely adapted from OSD.Viewer.onCanvasDragEnd and OSD.viewer.onCanvasScroll
      const viewer = this.osd_store.viewer
      const viewport = viewer.viewport
      if (event.ctrlKey) {
        const box = viewer.container.getBoundingClientRect()
        const position = new Openseadragon.Point(event.pageX - box.left, event.pageY - box.top)
        const factor = Math.pow(viewer.zoomPerScroll, -event.deltaY / 10)
        viewport.zoomBy(factor, viewport.pointFromPixel(position, true))
      } else {
        const center = viewport.pixelFromPoint(viewport.getCenter(true))
        const target = viewport.pointFromPixel(
          new Openseadragon.Point(center.x - 2 * event.deltaX, center.y + 2 * event.deltaY),
        )
        viewport.panTo(target, false)
      }
      viewport.applyConstraints()
    },
    bindViewer(viewer) {
      this.osd_store.bindViewer(viewer)
      viewer.addSimpleImage({ url: '/static/dread/world-clean.png', width: 1 })
    },
  },
}
</script>
