<template>
  <div class="app-body">
    <div :class="css" v-if="zones && zone">
      <unrest-toolbar v-if="$route.query.mode" :storage="tool_storage" class="-topleft">
        <template #buttons>
          <div
            v-if="$route.query.mode === 'screenshots'"
            class="btn -info"
            @click="managing_groups = true"
          >
            <i class="fa fa-object-group" />
          </div>
          <div v-if="$route.query.mode === 'room'" class="btn -info -fa-stack" @click="newRoom">
            <i class="fa fa-square-o" />
            <i class="fa fa-plus -fa-stack-badge" />
          </div>
        </template>
      </unrest-toolbar>
      <dread-viewer :zone="zone" :osd_store="osd_store" />
      <template v-if="osd_store.viewer">
        <html-overlay :viewer="osd_store.viewer">
          <template v-if="$route.query.mode === 'screenshots'">
            <screenshot-overlay
              v-for="screenshot in osd_store.state.screenshots"
              :key="screenshot.id"
              :screenshot="screenshot"
              :tool_storage="tool_storage"
              :osd_store="osd_store"
              :zone="zone"
            />
          </template>
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
            @select-item="osd_store.selectItem"
          />
        </html-overlay>
      </template>
      <group-manager
        v-if="managing_groups"
        @close="managing_groups = null"
        :osd_store="osd_store"
      />
    </div>
    <item-list
      v-if="zone"
      :zone_items="zone_items"
      :storage="osd_store"
      @select-item="osd_store.gotoItem"
    />
    <div v-if="debug" class="dread-debug">{{ debug }}</div>
    <unrest-admin-popup>
      <template #buttons>
        <router-link to="?mode=screenshots" class="btn btn-primary">
          <i class="fa fa-picture-o" />
        </router-link>
        <router-link to="?mode=room" class="btn btn-primary">
          <i class="fa fa-edit" />
        </router-link>
      </template>
    </unrest-admin-popup>
  </div>
</template>

<script>
import { startCase } from 'lodash'

import DreadItems from '@/models/DreadItems'
import DreadViewer from './Viewer.vue'
import GroupManager from './GroupManager.vue'
import ItemList from '@/components/ItemList.vue'
import RoomCanvas from './RoomCanvas.vue'
import ScreenshotOverlay from './ScreenshotOverlay.vue'
import HtmlOverlay from '@/vue-openseadragon/HtmlOverlay.vue'
import ToolStorage from './ToolStorage'
import OsdStore from './OsdStore'

const WORLD = 3 // hardcoded for now since this interface is dread only

const allowed_types = [...DreadItems.items, ...DreadItems.stations, ...DreadItems.transit]
const allowed_by_type = Object.fromEntries(allowed_types.map((t) => [t, true]))

export default {
  __route: {
    path: '/dread/:zone_slug/',
    meta: {
      title: ({ params }) => startCase(params.zone_slug),
    },
  },
  components: {
    DreadViewer,
    GroupManager,
    HtmlOverlay,
    ItemList,
    RoomCanvas,
    ScreenshotOverlay,
  },
  data() {
    return {
      debug: '',
      managing_groups: false,
      osd_store: OsdStore(this),
      tool_storage: ToolStorage(this),
    }
  },
  computed: {
    css() {
      const m = this.$route.query.mode
      const { selected_tool: _t, selected_variant: _v } = this.tool_storage.state
      return `flex-grow dread-zone -tool-${_t} -variant-${_v} -mode-${m}`
    },
    zones() {
      return this.$store.zone.getPage({ query: { world_id: WORLD, per_page: 5000 } })?.items
    },
    zone() {
      return this.zones?.find((z) => z.slug === this.$route.params.zone_slug)
    },
    search_params() {
      // items and rooms search on same values
      return { query: { zone: this.zone.id, per_page: 5000 } }
    },
    zone_items() {
      const world_items = this.$store.item2.getPage(this.search_params)?.items || []
      let zone_items = world_items.filter((i) => i.zone === this.zone.id)
      if (!this.$auth.user?.is_superuser) {
        zone_items = zone_items.filter((i) => allowed_by_type[i.data.type])
      }
      return zone_items
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
        zone: this.zone.id,
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