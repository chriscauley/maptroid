<template>
  <div class="app-body -full-screen">
    <div :class="css.wrapper" v-if="$store.route.zone">
      <unrest-toolbar v-if="$route.query.mode" class="-topleft">
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
      <dread-viewer />
      <template v-if="osd_store.viewer">
        <html-overlay :viewer="osd_store.viewer">
          <template v-if="$route.query.mode === 'screenshots'">
            <screenshot-overlay
              v-for="screenshot in osd_store.state.screenshots"
              :key="screenshot.id"
              :screenshot="screenshot"
            />
          </template>
          <room-canvas
            v-for="room in $store.route.zone_rooms"
            :key="room.id"
            :room="room"
            @debug="setDebug"
            @delete="deleteRoom"
            @delete-item="deleteItem"
            @add-item="addItem"
            @select-item="gotoItem"
          />
        </html-overlay>
      </template>
      <group-manager v-if="managing_groups" @close="managing_groups = null" />
    </div>
    <video-player />
    <item-list :items="items" @select-item="gotoItem" />
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
import ItemMixin from '@/store/ItemMixin'
import ItemList from '@/components/ItemList.vue'
import RoomCanvas from './RoomCanvas.vue'
import ScreenshotOverlay from './ScreenshotOverlay.vue'
import HtmlOverlay from '@/vue-openseadragon/HtmlOverlay.vue'
import ToolStorage from './ToolStorage'
import OsdStore from './OsdStore'

export default {
  __route: {
    name: 'dread_map',
    path: '/maps/:world_slug/:zone_slug/',
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
  },
  mixins: [Mousetrap.Mixin, ItemMixin],
  provide() {
    return {
      tool_storage: computed(() => this.tool_storage),
      osd_store: computed(() => this.osd_store),
      transit_choices: computed(() => {
        const match = (i) => i.data.type.match(/^(teleportal|transit)/)
        const items = this.$store.route.world_items.filter(match).map((i) => {
          const { zone } = this.$store.route
          return {
            id: i.id,
            type: i.data.type,
            zone_id: i.zone,
            _target: i.data.transit_target_id,
            to: {
              name: 'dread_map',
              params: { world_slug: 'dread', zone_slug: zone.slug },
              query: { item: i.id },
            },
            name: i.data.name || `${DreadItems.getName(i)} - ${zone.name}`,
          }
        })
        return sortBy(items, 'name')
      }),
    }
  },
  data() {
    return {
      mousetrap: { g: this.toggleGrid, esc: this.$store.route.blurItem },
      debug: '',
      managing_groups: false,
      osd_store: OsdStore(this),
      tool_storage: ToolStorage(this),
    }
  },
  computed: {
    items() {
      const items = DreadItems.filterDisplayItems(this.$store.route.zone_items, this.$auth.user)
      return DreadItems.prepDisplayItems(items)
    },
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
  },
  methods: {
    toggleGrid() {
      const { hide_grid } = this.tool_storage.state
      this.tool_storage.save({ hide_grid: !hide_grid })
    },
    setDebug(value) {
      this.debug = value
    },
    deleteRoom(room) {
      this.$store.room.delete(room).then(this.refetchRooms)
    },
    deleteItem(item) {
      this.$store.item.delete(item).then(this.refetchItems)
    },
    newRoom() {
      const { zone, world } = this.$store.route
      const { x, y } = this.osd_store.viewer.viewport.getCenter()
      const scale = (i) => Math.floor((i * 1280) / zone.data.screenshot.px_per_block)
      const room = {
        world: world.id,
        zone: zone.id,
        data: {
          zone_bounds: [scale(x), scale(y), 10, 10],
        },
      }
      this.$store.room.save(room).then(this.$store.route.refetchRooms)
    },
    addItem(item) {
      item.zone = this.$store.route.zone.id
      this.$store.item.save(item).then(this.$store.route.refetchItems)
    },
    gotoItem(item) {
      this.osd_store.gotoItem(item)
      const { slug } = this.$store.route.zone
      this.$router.replace({
        name: 'dread_map',
        params: { zone_slug: slug, world_slug: 'dread' },
        query: { item: item.id },
      })
    },
  },
}
</script>
