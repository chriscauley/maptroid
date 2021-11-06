<template>
  <open-seadragon
    @mousewheel.prevent="osdWheel"
    :options="osd_options"
    :callback="osd_store.bindViewer"
    class="dread-viewer"
    :pixelated="true"
  />
</template>

<script>
import Openseadragon from 'openseadragon'
import { sortBy } from 'lodash'

const WORLD = 3 // hardcoded for now since this interface is dread only

export default {
  props: {
    zone: Object,
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
        gestureSettingsMouse: {
          clickToZoom: false,
          dblClickToZoom: false,
        },
      }
    },
    search_params() {
      // screenshots and zones search on same values
      const { zone_id } = this.$route.params
      return { query: { world: WORLD, zone: zone_id, per_page: 5000 } }
    },
  },
  async mounted() {
    window.$store = this.$store
    let { items } = await this.$store.screenshot.fetchPage(this.search_params)
    const { limit, sort_from, show_all = false } = this.$route.query

    // Because of the top gradient in the Dread map viewer, we need ot put down bottommost pieces first
    // sort from bottom to put top most pieces on top
    items = sortBy(items, 'data.zone.xy.1')
    items = sortBy(items, 'data.zone.group')
    items.reverse()

    if (!show_all) {
      items = items.filter((i) => i.data.zone?.group !== 8)
    }
    if (limit && sort_from) {
      let limited = []
      const rest = []
      items.forEach((i) => (i.data.zone?.group === 1 ? limited : rest).push(i))
      const sort_index = ['right', 'left'].includes(sort_from) ? 0 : 1
      limited = sortBy(limited, `data.zone.xy.${sort_index}`)
      if (['bottom', 'right'].includes(sort_from)) {
        limited.reverse()
      }
      items = limited.slice(0, parseInt(limit)).concat(rest)
    }
    this.osd_store.addScreenshots(items)
  },
  methods: {
    osdWheel(event) {
      // Loosely adapted from OSD.Viewer.onCanvasDragEnd and OSD.viewer.onCanvasScroll
      const viewer = this.osd_store.viewer
      const viewport = viewer.viewport
      if (event.ctrlKey) {
        const box = viewer.container.getBoundingClientRect()
        const position = new Openseadragon.Point(event.pageX - box.left, event.pageY - box.top)
        const factor = Math.pow(viewer.zoomPerScroll, event.deltaY / 10)
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
  },
}
</script>
