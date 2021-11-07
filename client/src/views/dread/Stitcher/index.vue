<template>
  <div class="app-body">
    <div :class="css" v-if="zone">
      <unrest-toolbar :storage="tool_storage" class="-topleft">
        <template #buttons>
          <div class="btn -info" @click="managing_groups = true">
            <i class="fa fa-object-group" />
          </div>
          <div class="btn -info -fa-stack" @click="newRoom">
            <i class="fa fa-square-o" />
            <i class="fa fa-plus -fa-stack-badge" />
          </div>
        </template>
      </unrest-toolbar>
      <dread-viewer :zone="zone" :osd_store="osd_store" />
      <template v-if="osd_store.viewer">
        <html-overlay :viewer="osd_store.viewer">
          <screenshot-overlay
            v-for="screenshot in osd_store.state.screenshots"
            :key="screenshot.id"
            :screenshot="screenshot"
            :tool_storage="tool_storage"
            :osd_store="osd_store"
            :zone="zone"
          />
          <room-canvas
            v-for="room in rooms"
            :key="room.id"
            :room="room"
            :tool_storage="tool_storage"
            :osd_store="osd_store"
            @debug="setDebug"
            @delete="deleteRoom"
            @delete-item="deleteItem"
            @add-item="addItem"
            :zone_items="zone_items"
          />
        </html-overlay>
      </template>
      <group-manager
        v-if="managing_groups"
        @close="managing_groups = null"
        :osd_store="osd_store"
      />
    </div>
    <div class="dread-debug">{{ debug }}</div>
  </div>
</template>

<script>
import { startCase } from 'lodash'

import DreadViewer from './Viewer.vue'
import GroupManager from './GroupManager.vue'
import RoomCanvas from './RoomCanvas.vue'
import ScreenshotOverlay from './ScreenshotOverlay.vue'
import HtmlOverlay from '@/vue-openseadragon/HtmlOverlay.vue'
import tool_storage from './tools'
import OsdStore from './OsdStore'

const WORLD = 3 // hardcoded for now since this interface is dread only

export default {
  __route: {
    path: '/dread-stitcher/:zone_id/:zone_slug/',
    meta: {
      title: ({ params }) => startCase(params.zone_slug),
    },
  },
  components: {
    DreadViewer,
    GroupManager,
    HtmlOverlay,
    RoomCanvas,
    ScreenshotOverlay,
  },
  data() {
    return {
      tool_storage,
      managing_groups: false,
      debug: '',
      osd_store: OsdStore(this),
    }
  },
  computed: {
    css() {
      const { selected_tool: _t, selected_variant: _v } = tool_storage.state
      return `flex-grow dread-stitcher -tool-${_t} -variant-${_v}`
    },
    mode() {
      const { selected_tool } = tool_storage.state
      if (['ss_move', 'ss_group', 'ss_trash'].includes(selected_tool)) {
        return 'screenshots'
      }
      return 'room'
    },
    zone() {
      return this.$store.zone.getOne(this.$route.params.zone_id)
    },
    zone_items() {
      return this.$store.item2.getPage(this.search_params)?.items || []
    },
    search_params() {
      // screenshots and zones search on same values
      const { zone_id } = this.$route.params
      return { query: { zone: zone_id, per_page: 5000 } }
    },
    rooms() {
      return this.$store.room2.getPage(this.search_params)?.items
    },
  },
  methods: {
    setDebug(value) {
      this.debug = value
    },
    refetchItems() {
      this.$store.item2.api.markStale()
      this.$store.item2.getPage(this.search_params)
    },
    refetchRooms() {
      this.$store.room2.api.markStale()
      this.$store.room2.getPage(this.search_params)
    },
    deleteRoom(room) {
      this.$store.room2.delete(room).then(this.refetchRooms)
    },
    deleteItem(item) {
      this.$store.item2.delete(item).then(this.refetchItems)
    },
    newRoom() {
      const { x, y } = this.osd_store.viewer.viewport.getCenter()
      const scale = (i) => Math.floor((i * 1280) / this.zone.data.screenshot.px_per_block)
      const room = {
        world: WORLD,
        zone: this.$route.params.zone_id,
        data: {
          zone_bounds: [scale(x), scale(y), 10, 10],
        },
      }
      this.$store.room2.save(room).then(this.refetchRooms)
    },
    addItem(item) {
      item.zone = this.zone.id
      this.$store.item2.save(item).then(this.refetchItems)
    },
  },
}
</script>
