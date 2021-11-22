<template>
  <div class="app-body -full-screen">
    <template v-if="world && rooms">
      <base-viewer :osd_store="osd_store" @viewer-bound="loadImages" />
      <template v-if="osd_store.viewer && zone">
        <html-overlay :viewer="osd_store.viewer">
          <room-box v-for="room in rooms" :key="room.id" :room="room" />
        </html-overlay>
      </template>
    </template>
    <admin-popup :rooms="rooms" />
  </div>
</template>

<script>
import { computed } from 'vue'

import AdminPopup from './AdminPopup.vue'
import BaseViewer from '@/components/BaseViewer'
import HtmlOverlay from '@/vue-openseadragon/HtmlOverlay.vue'
import RoomBox from './RoomBox.vue'
import OsdStore from './OsdStore'

export default {
  __route: {
    path: '/sm/:world_slug/:zone_slug/',
  },
  components: { AdminPopup, BaseViewer, HtmlOverlay, RoomBox },
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
    zone() {
      return this.zones.find((z) => (z.slug = this.$route.params.zone_slug))
    },
    rooms() {
      const q = { query: { per_page: 5000, zone__slug: this.$route.params.zone_slug } }
      const rooms = this.$store.room2.getPage(q)?.items || []
      return rooms
    },
    css() {
      return {
        wrapper: ['app-sm'],
      }
    },
  },
  methods: {
    loadImages() {
      if (this.osd_store.viewer.world.getItemCount() === 0) {
        this.loadCorners()
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
