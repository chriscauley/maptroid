<template>
  <div class="app-body" v-if="zones">
    <viewer :osd_store="osd_store" :zones="zones" />
    <div v-if="osd_store.viewer">
      <html-overlay :viewer="osd_store.viewer">
        <zone-box v-for="zone in zones" :key="zone.id" :zone="zone" :osd_store="osd_store" />
      </html-overlay>
    </div>
  </div>
</template>

<script>
import HtmlOverlay from '@/vue-openseadragon/HtmlOverlay.vue'

import OsdStore from './OsdStore'
import Viewer from './Viewer.vue'
import ZoneBox from './ZoneBox.vue'

const WORLD = 3 // hardcoded to dread

export default {
  __route: {
    path: '/dread/',
  },
  components: { HtmlOverlay, Viewer, ZoneBox },
  data() {
    const osd_store = OsdStore(this)
    return { osd_store }
  },
  computed: {
    zones() {
      const q = { query: { per_page: 5000, world: WORLD } }
      return this.$store.zone.getPage(q)?.items?.filter((z) => !z.data.hidden)
    },
  },
}
</script>
