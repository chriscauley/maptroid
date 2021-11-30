<template>
  <div :class="wrapper_class" v-if="ready">
    <base-viewer :osd_store="osd_store" @viewer-bound="loadImages" />
    <template v-if="osd_store.viewer">
      <html-overlay :viewer="osd_store.viewer">
        <template v-if="$store.route.zone">
          <room-box
            v-for="room in $store.route.zone_rooms"
            :key="room.id"
            :room="room"
            mode="arrange"
          />
        </template>
        <template v-else>
          <zone-box v-for="zone in zones" :key="zone.id" :zone="zone" />
        </template>
      </html-overlay>
    </template>
    <item-list v-if="items.length" :items="items" />
    <admin-popup class="-left" />
  </div>
</template>

<script>
import Openseadragon from 'openseadragon'
import { computed } from 'vue'

import AdminPopup from './AdminPopup.vue'
import BaseViewer from '@/components/BaseViewer'
import HtmlOverlay from '@/vue-openseadragon/HtmlOverlay.vue'
import OsdStore from './OsdStore'
import prepItem from './prepItem'
import RoomBox from './RoomBox.vue'
import ItemList from '@/components/ItemList.vue'
import ZoneBox from './ZoneBox.vue'

const { Rect } = Openseadragon

export default {
  __route: {
    path: '/sm/:world_slug/:zone_slug?/',
  },
  components: { AdminPopup, BaseViewer, HtmlOverlay, RoomBox, ItemList, ZoneBox },
  provide() {
    return {
      video: () => null,
      osd_store: computed(() => this.osd_store),
    }
  },
  data() {
    const osd_store = OsdStore(this)
    return { osd_store }
  },
  computed: {
    ready() {
      const { world, world_rooms } = this.$store.route
      return world && this.zones.length && world_rooms.length
    },
    items() {
      const { zone, zone_items, world_items } = this.$store.route
      return (zone ? zone_items : world_items).map((item) => ({
        ...item,
        ...prepItem(item),
      }))
    },
    zones() {
      return this.$store.route.zones.filter((z) => !z.data.hidden)
    },
    wrapper_class() {
      const zoom = Math.round(this.osd_store.state.zoom)
      return `app-body -full-screen -zoom-${zoom}`
    },
  },
  methods: {
    loadImages() {
      let x_max = 10
      let y_max = 10
      const { zone, zone_rooms } = this.$store.route
      if (zone) {
        zone_rooms.forEach((room) => {
          const [x, y, width, height] = room.data.zone.bounds
          x_max = Math.max(x_max, x + width)
          y_max = Math.max(y_max, y + height)
        })
      } else {
        this.zones.forEach((zone) => {
          const [x, y, width, height] = zone.data.world.bounds
          const tileSource = zone.data.dzi
          this.osd_store.viewer.addTiledImage({ tileSource, width: width, x, y })
          x_max = Math.max(x_max, x + width)
          y_max = Math.max(y_max, y + height)
        })
      }
      this.osd_store.viewer.addOnceHandler('tile-loaded', () =>
        this.osd_store.viewer.viewport.fitBounds(new Rect(0, 0, x_max, y_max), true),
      )
      this.loadCorners(x_max, y_max)
    },
    loadCorners(x_max, y_max) {
      x_max -= 1
      y_max -= 1
      const url = '/static/corner_64.png'
      const corners = [
        [0, 0, 0],
        [0, y_max, 270],
        [x_max, y_max, 180],
        [x_max, 0, 90],
      ]
      corners.forEach(([x, y, degrees]) => {
        this.osd_store.viewer.addSimpleImage({ url, x, y, width: 1, opacity: 1, degrees })
      })
    },
  },
}
</script>
