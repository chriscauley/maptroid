<template>
  <div class="app-body -full-screen">
    <base-viewer class="dread-world-viewer" :osd_store="osd_store" @viewer-bound="open" />
    <div v-if="osd_store.viewer">
      <html-overlay :viewer="osd_store.viewer">
        <zone-box
          v-for="zone in $store.route.zones"
          :key="zone.id"
          :zone="zone"
          :osd_store="osd_store"
        />
      </html-overlay>
    </div>
    <video-player />
    <item-list :items="items" @select-item="gotoItem" />
  </div>
</template>

<script>
import HtmlOverlay from '@/vue-openseadragon/HtmlOverlay.vue'

import BaseViewer from '@/components/BaseViewer.vue'
import DreadItems from '@/models/DreadItems'
import ItemList from '@/components/ItemList.vue'
import OsdStore from './OsdStore'
import VideoPlayer from '@/components/Video/index.vue'
import ZoneBox from './ZoneBox.vue'

export default {
  components: { BaseViewer, HtmlOverlay, ItemList, VideoPlayer, ZoneBox },
  data() {
    DreadItems.makeCss()
    const osd_store = OsdStore(this)
    return { osd_store, selected_item: null }
  },
  computed: {
    items() {
      let items = DreadItems.filterDisplayItems(this.$store.route.world_items, this.$auth.user)
      return DreadItems.prepDisplayItems(items)
    },
  },
  methods: {
    gotoItem(item) {
      const zone = this.$store.route.zones.find((z) => z.id === item.zone)
      this.$router.push({
        name: this.$route.name,
        params: { world_slug: this.$route.params.world_slug, zone_slug: zone.slug },
        query: { item: item.id },
      })
    },
    open() {
      const url = '/static/dread/zone_shapes/world-clean_short.png'
      this.osd_store.viewer.addSimpleImage({ url, width: 1 })
    },
  },
}
</script>
