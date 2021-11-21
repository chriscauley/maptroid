<template>
  <base-viewer class="dread-viewer" :osd_store="osd_store" />
  <zoom-controls v-if="osd_store.viewer" :viewer="osd_store.viewer" />
</template>

<script>
import BaseViewer from '@/components/BaseViewer.vue'
import ZoomControls from '@/vue-openseadragon/ZoomControls.vue'
import { sortBy } from 'lodash'

const WORLD = 3 // hardcoded for now since this interface is dread only

export default {
  components: { BaseViewer, ZoomControls },
  props: {
    zone: Object,
    osd_store: Object,
  },
  computed: {
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
}
</script>
