<template>
  <div class="app-body -full-screen" v-if="zones">
    <base-viewer class="dread-world-viewer" :osd_store="osd_store" @viewer-bound="open" />
    <div v-if="osd_store.viewer">
      <html-overlay :viewer="osd_store.viewer">
        <zone-box v-for="zone in zones" :key="zone.id" :zone="zone" :osd_store="osd_store" />
      </html-overlay>
    </div>
    <template v-if="video">
      <item-list :zone_items="items" @select-item="gotoItem" :video="video" />
      <video-player :world_items="items" />
    </template>
  </div>
</template>

<script>
import { sortBy } from 'lodash'
import { computed } from 'vue'
import HtmlOverlay from '@/vue-openseadragon/HtmlOverlay.vue'

import BaseViewer from '@/components/BaseViewer.vue'
import DreadItems from '@/models/DreadItems'
import ItemList from '@/components/ItemList.vue'
import OsdStore from './OsdStore'
import VideoPlayer from '@/components/Video.vue'
import ZoneBox from './ZoneBox.vue'

const WORLD = 3 // hardcoded to dread
const WORLD_QUERY = { query: { world_id: WORLD, per_page: 5000 } }

export default {
  __route: {
    path: '/dread/',
  },
  components: { BaseViewer, HtmlOverlay, ItemList, VideoPlayer, ZoneBox },
  provide() {
    return {
      video: computed(() => this.video),
      videos: computed(() => this.videos),
    }
  },
  data() {
    DreadItems.makeCss()
    const osd_store = OsdStore(this)
    return { osd_store, selected_item: null }
  },
  computed: {
    zones() {
      const q = { query: { per_page: 5000, world: WORLD } }
      return this.$store.zone.getPage(q)?.items?.filter((z) => !z.data.hidden)
    },
    items() {
      const q = { query: { per_page: 5000, zone__world_id: WORLD } }
      let items = this.$store.item2.getPage(q)?.items || []
      items = sortBy(items, (i) => this.video.times_by_id[i.id]?.[0].seconds || Infinity)
      return DreadItems.prepDisplayItems(items, this.videos)
    },

    // TODO all video stuff is taken from the zone component and needs to be fixed
    videos() {
      return this.$store.video.getPage(WORLD_QUERY)?.items || []
    },
    video() {
      const { selected_video_id } = this.$store.local.state
      return this.videos.find((v) => v.id === selected_video_id) || this.videos[0]
    },
  },
  methods: {
    gotoItem(item) {
      const zone = this.zones.find((z) => z.id === item.zone)
      this.$router.push(`/dread/${zone.slug}/?item=${item.id}`)
    },
    open() {
      const url = '/static/dread/zone_shapes/world-clean_short.png'
      this.osd_store.viewer.addSimpleImage({ url, width: 1 })
    },
  },
}
</script>
