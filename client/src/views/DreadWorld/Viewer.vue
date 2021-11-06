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
import Openseadragon from 'openseadragon'

export default {
  props: {
    zones: Array,
    osd_store: Object,
  },
  computed: {
    osd_options() {
      return {
        maxZoomPixelRatio: 4,
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
      viewer.addSimpleImage({ url: '/static/dread/world-clean_short.png', width: 1 })

      // ABANDONED - This works, but does not look really line up with overworld map
      // this.zones.forEach((zone, i_zone) => {
      //   const { width, height } = zone.data.output.ratio_bounds
      //   const [center_x, center_y] = zone.data.world.center_xy
      //   const adjusted_width = width * 200 / (11 * 1280)
      //   const adjusted_height = height * 200 / (11 * 1280)
      //   viewer.addTiledImage({
      //     tileSource: zone.data.output.dzi,
      //     width: adjusted_width,
      //     x: center_x - adjusted_width / 2,
      //     y: center_y - adjusted_height / 2,
      //     index: i_zone +1,
      //   })
      // })
    },
  },
}
</script>
