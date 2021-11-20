<template>
  <open-seadragon
    @mousewheel.prevent="osdWheel"
    :options="osd_options"
    :callback="osd_store.bindViewer"
    class="dread-viewer"
    :pixelated="true"
    :is_editor="$auth.user?.is_superuser"
  />
  <zoom-controls v-if="osd_store.viewer" :viewer="osd_store.viewer" />
</template>

<script>
import ZoomControls from '@/vue-openseadragon/ZoomControls.vue'
import Openseadragon from 'openseadragon'
import { sortBy } from 'lodash'

const WORLD = 3 // hardcoded for now since this interface is dread only

// TODO put this feature in a config menu
// currently, because OSD loves to eat events, I disable OSD's controls while editing
// but osd's natural usage is better for everyone else
// the only way to trigger this is to manually set this in the console
const IS_EDITOR = localStorage.getItem('is_an_editor')

export default {
  components: { ZoomControls },
  props: {
    zone: Object,
    osd_store: Object,
  },
  computed: {
    osd_options() {
      const editing = !!this.$route.query.mode
      return {
        maxZoomPixelRatio: editing ? 8 : 4,
        navigatorAutoFade: false,
        showNavigator: true,
        showZoomControl: false,
        showHomeControl: false,
        showFullPageControl: false,
        showRotationControl: false,
        debugmode: false,
        clickTimeThreshold: 1000,
        mouseNavEnabled: !IS_EDITOR,
        gestureSettingsMouse: {
          clickToZoom: false,
          dblClickToZoom: false,
        },
      }
    },
    search_params() {
      // screenshots and zones search on same values
      return { query: { world: WORLD, zone: this.zone.id, per_page: 5000 } }
    },
  },
  async mounted() {
    if (this.$route.query.mode === 'screenshots') {
      let { items } = await this.$store.screenshot.fetchPage(this.search_params)
      const { limit, sort_from, show_all = false } = this.$route.query

      // Because of the top gradient in the Dread map viewer, we need ot put down bottommost pieces first
      // sort from bottom to put top most pieces on top
      items = sortBy(items, 'data.zone.xy.1')
      // items = sortBy(items, 'data.zone.group')
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
    } else {
      const { min_x: x, min_y: y, width } = this.zone.data.output.ratio_bounds
      const tileSource = this.zone.data.output.dzi
      this.osd_store.viewer.addTiledImage({ tileSource, width, x, y })
    }
  },
  methods: {
    osdWheel(event) {
      // Loosely adapted from OSD.Viewer.onCanvasDragEnd and OSD.viewer.onCanvasScroll
      if (!IS_EDITOR) {
        return
      }
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
          new Openseadragon.Point(center.x + 2 * event.deltaX, center.y + 2 * event.deltaY),
        )
        viewport.panTo(target, false)
      }
      viewport.applyConstraints()
    },
  },
}
</script>
