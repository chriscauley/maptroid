<template>
  <div class="app-body -full-screen">
    <template v-if="world && zones.length">
      <base-viewer :osd_store="osd_store" @viewer-bound="loadImages" />
      <template v-if="osd_store.viewer">
        <html-overlay :viewer="osd_store.viewer">
          <template v-if="viewer_mode === 'zones'">
            <zone-box v-for="zone in zones" :key="zone.id" :zone="zone" :world_rooms="rooms" />
          </template>
          <template v-if="viewer_mode === 'rooms'">
            <room-box v-for="room in zone_rooms" :key="room.id" :room="room" />
          </template>
        </html-overlay>
      </template>
    </template>
    <admin-popup :rooms="zone_rooms" />
  </div>
</template>

<script>
import { computed } from 'vue'

import AdminPopup from './AdminPopup.vue'
import BaseViewer from '@/components/BaseViewer'
import HtmlOverlay from '@/vue-openseadragon/HtmlOverlay.vue'
import OsdStore from './OsdStore'
import RoomBox from './RoomBox.vue'
import ZoneBox from './ZoneBox.vue'

export default {
  __route: {
    path: '/sm/:world_slug/:zone_slug?/',
  },
  components: { AdminPopup, BaseViewer, HtmlOverlay, RoomBox, ZoneBox },
  provide() {
    return {
      osd_store: computed(() => this.osd_store),
    }
  },
  data() {
    const osd_store = OsdStore(this)
    return { osd_store }
  },
  computed: {
    viewer_mode() {
      return this.$route.params.zone_slug ? 'rooms' : 'zones'
    },
    world() {
      return this.$store.world2.getFromRoute(this.$route).current
    },
    world_params() {
      const world_id = this.world.id
      return { query: { per_page: 5000, world: world_id } }
    },
    zones() {
      return this.$store.zone.getPage(this.world_params)?.items || []
    },
    rooms() {
      return this.$store.room2.getPage(this.world_params)?.items || []
    },
    zone_rooms() {
      if (this.viewer_mode === 'rooms') {
        const zone = this.zones.find((z) => z.slug === this.$route.params.zone_slug)
        return this.rooms.filter((r) => r.zone === zone.id)
      }
      return null
    },
    css() {
      return {
        wrapper: ['app-sm'],
      }
    },
  },
  methods: {
    loadImages() {
      this.loadCorners()
      if (this.viewer_mode === 'zones') {
        this.zones.forEach((zone) => {
          const [x, y, width] = zone.data.world.bounds
          const tileSource = zone.data.dzi
          this.osd_store.viewer.addTiledImage({ tileSource, width: width, x, y })
        })
      }
    },
    loadCorners() {
      const url = '/static/corner_64.png'
      const W = 128 // arbitrary number that will hopefully fit entire map
      const corners = [
        [0, 0, 0],
        [0, W, 270],
        [W, W, 180],
        [W, 0, 90],
      ]
      corners.forEach(([x, y, degrees]) => {
        this.osd_store.viewer.addSimpleImage({ url, x, y, width: 1, opacity: 1, degrees })
      })
    },
  },
}
</script>
