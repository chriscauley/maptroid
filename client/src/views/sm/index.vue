<template>
  <div :class="wrapper_class" v-if="ready">
    <base-viewer :osd_store="osd_store" @viewer-bound="loadImages" />
    <template v-if="osd_store.viewer">
      <html-overlay :viewer="osd_store.viewer">
        <template v-if="viewer_mode === 'zones'">
          <zone-box v-for="zone in zones" :key="zone.id" :zone="zone" :world_rooms="rooms" />
        </template>
        <template v-if="viewer_mode === 'rooms'">
          <room-box v-for="room in zone_rooms" :key="room.id" :room="room" :items="items" />
        </template>
      </html-overlay>
    </template>
    <item-list v-if="items.length" :items="items" />
    <admin-popup :rooms="zone_rooms" class="-left" />
  </div>
</template>

<script>
import { startCase } from 'lodash'
import Openseadragon from 'openseadragon'
import { computed } from 'vue'

import AdminPopup from './AdminPopup.vue'
import BaseViewer from '@/components/BaseViewer'
import HtmlOverlay from '@/vue-openseadragon/HtmlOverlay.vue'
import OsdStore from './OsdStore'
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
    viewer_mode() {
      return this.$route.params.zone_slug ? 'rooms' : 'zones'
    },
    ready() {
      if (this.viewer_mode === 'rooms') {
        return this.world && this.zones.length && this.rooms.length
      }
      return this.world && this.zones.length
    },
    world() {
      return this.$store.world2.getFromRoute(this.$route).current
    },
    world_params() {
      const world_id = this.world.id
      return { query: { per_page: 5000, world: world_id } }
    },
    items() {
      const q = { query: { per_page: 5000, zone__world_id: this.world.id } }
      let items = this.$store.item2.getPage(q)?.items || []
      if (this.viewer_mode === 'rooms') {
        const zone = this.zones.find((z) => z.slug === this.$route.params.zone_slug)
        items = items.filter((i) => i.zone === zone?.id)
      }
      return items.map((item) => {
        return {
          ...item,
          name: startCase(item.data.type),
          icon: `sm-item -${item.data.type}`,
          room_xy: item.data.room_xy,
        }
      })
    },
    zones() {
      const zones = this.$store.zone.getPage(this.world_params)?.items || []
      return zones.filter(z => !z.data.hidden)
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
    wrapper_class() {
      const zoom = Math.round(this.osd_store.state.zoom)
      return `app-body -full-screen -zoom-${zoom}`
    },
  },
  methods: {
    loadImages() {
      let x_max = 10
      let y_max = 10
      if (this.viewer_mode === 'zones') {
        this.zones.forEach((zone) => {
          const [x, y, width, height] = zone.data.world.bounds
          const tileSource = zone.data.dzi
          this.osd_store.viewer.addTiledImage({ tileSource, width: width, x, y })
          x_max = Math.max(x_max, x + width)
          y_max = Math.max(y_max, y + height)
        })
      } else {
        this.zone_rooms.forEach((room) => {
          const [x, y, width, height] = room.data.zone.bounds
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
