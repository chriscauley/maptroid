<template>
  <div class="app-body -full-screen">
    <div :class="css.wrapper" v-if="zones && zone">
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
          <div :class="css.grid_toggle" @click="toggleGrid">
            <i class="fa fa-hashtag" />
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
            :zones="zones"
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
    <video-player v-if="video" :world_items="world_items" />
    <item-list v-if="zone" :zone_items="zone_items" @select-item="osd_store.gotoItem" />
    <div v-if="debug" class="dread-debug">{{ debug }}</div>
    <admin-popup />
  </div>
</template>

<script>
import { computed } from 'vue'
import Mousetrap from '@unrest/vue-mousetrap'
import { startCase, sortBy } from 'lodash'

import AdminPopup from './AdminPopup.vue'
import DreadItems from '@/models/DreadItems'
import DreadViewer from './Viewer.vue'
import GroupManager from './GroupManager.vue'
import ItemList from '@/components/ItemList.vue'
import RoomCanvas from './RoomCanvas.vue'
import ScreenshotOverlay from './ScreenshotOverlay.vue'
import HtmlOverlay from '@/vue-openseadragon/HtmlOverlay.vue'
import ToolStorage from './ToolStorage'
import OsdStore from './OsdStore'
import VideoPlayer from '@/components/Video.vue'

const WORLD = 3 // hardcoded for now since this interface is dread only
const WORLD_QUERY = { query: { world_id: WORLD, per_page: 5000 } }

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
    AdminPopup,
    DreadViewer,
    GroupManager,
    HtmlOverlay,
    ItemList,
    RoomCanvas,
    ScreenshotOverlay,
    VideoPlayer,
  },
  mixins: [Mousetrap.Mixin],
  provide() {
    return {
      video: computed(() => this.video),
      videos: computed(() => this.videos),
    }
  },
  data() {
    return {
      mousetrap: { g: this.toggleGrid, esc: this.blurItem },
      debug: '',
      managing_groups: false,
      osd_store: OsdStore(this),
      tool_storage: ToolStorage(this),
    }
  },
  computed: {
    css() {
      const m = this.$route.query.mode
      const { selected_tool: _t, selected_variant: _v, hide_grid: _g } = this.tool_storage.state
      const zoom = Math.round(this.osd_store.state.zoom)
      return {
        wrapper: [
          `flex-grow dread-zone -tool-${_t} -variant-${_v} -mode-${m} -zoom-${zoom}`,
          _g && '-hide-grid',
        ],
        grid_toggle: `btn -${_g ? 'danger' : 'secondary'}`,
      }
    },
    zones() {
      return this.$store.zone.getPage(WORLD_QUERY)?.items
    },
    zone() {
      return this.zones?.find((z) => z.slug === this.$route.params.zone_slug)
    },
    room_params() {
      return { query: { zone: this.zone.id, per_page: 5000 } }
    },
    world_items() {
      const items = this.$store.item2.getPage(WORLD_QUERY)?.items || []
      if (this.videos.length) {
        const video = this.video || this.videos[0]
        return sortBy(items, (i) => video.times_by_id[i.id]?.[0].seconds || Infinity)
      }
      return items
    },
    zone_items() {
      let zone_items = this.world_items.filter((i) => i.zone === this.zone.id)
      if (!this.$auth.user?.is_superuser) {
        zone_items = zone_items.filter((i) => allowed_by_type[i.data.type])
      }
      return DreadItems.prepDisplayItems(zone_items, this.videos)
    },
    rooms() {
      return this.$store.room2.getPage(this.room_params)?.items
    },
    videos() {
      return this.$store.video.getPage(WORLD_QUERY)?.items || []
    },
    video() {
      const { selected_video_id } = this.$store.local.state
      return this.videos.find((v) => v.id === selected_video_id) || this.videos[0]
    },
  },
  mounted() {
    document.addEventListener('click', this.blurItem)
  },
  unmounted() {
    document.removeEventListener('click', this.blurItem)
  },
  methods: {
    toggleGrid() {
      const { hide_grid } = this.tool_storage.state
      this.tool_storage.save({ hide_grid: !hide_grid })
    },
    setDebug(value) {
      this.debug = value
    },
    refetchItems() {
      this.$store.item2.api.markStale()
      this.$store.item2.getPage(WORLD_QUERY)
    },
    refetchRooms() {
      this.$store.room2.api.markStale()
      this.$store.room2.getPage(this.room_params)
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
    blurItem() {
      this.osd_store.selectItem(null)
    },
  },
}
</script>
