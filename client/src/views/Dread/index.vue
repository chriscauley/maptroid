<template>
  <div class="app-body">
    <div class="flex-grow" v-if="zone">
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
      <dread-viewer :zone="zone" />
      <template v-if="$store.osd.viewer">
        <html-overlay>
          <screenshot-overlay
            v-for="screenshot in $store.osd.state.screenshots"
            :key="screenshot.id"
            :screenshot="screenshot"
            :storage="tool_storage"
          />
          <room-canvas
            v-for="room in rooms"
            :key="room.id"
            :room="room"
            :mode="room_mode"
            @debug="setDebug"
          />
        </html-overlay>
      </template>
      <group-manager v-if="managing_groups" @close="managing_groups = null" />
    </div>
    <room-form
      v-if="editing_room"
      :room="editing_room"
      @close="editing_room = null"
      @refetch="refetchRooms"
    />
    <div class="dread-debug">{{ debug }}</div>
  </div>
</template>

<script>
import { startCase } from 'lodash'

import DreadViewer from './Viewer.vue'
import GroupManager from './GroupManager.vue'
import RoomCanvas from './RoomCanvas.vue'
import RoomForm from './RoomForm.vue'
import ScreenshotOverlay from './ScreenshotOverlay.vue'
import HtmlOverlay from '@/vue-openseadragon/HtmlOverlay.vue'
import tool_storage from './tools'

const WORLD = 3 // hardcoded for now since this interface is dread only

export default {
  __route: {
    path: '/dread/:zone_id/:zone_slug/',
    meta: {
      title: ({ params }) => startCase(params.zone_slug),
    },
  },
  components: {
    DreadViewer,
    GroupManager,
    HtmlOverlay,
    RoomCanvas,
    RoomForm,
    ScreenshotOverlay,
  },
  data() {
    return {
      editing_room: null,
      tool_storage,
      managing_groups: false,
      debug: '',
    }
  },
  computed: {
    zone() {
      return this.$store.zone.getOne(this.$route.params.zone_id)
    },
    room_mode() {
      const { selected_tool, selected_variant } = tool_storage.state
      return selected_tool === 'room' ? selected_variant : undefined
    },
    search_params() {
      // screenshots and zones search on same values
      const { zone_id } = this.$route.params
      return { query: { world: WORLD, zone: zone_id, per_page: 5000 } }
    },
    rooms() {
      return this.$store.room2.getPage(this.search_params)?.items
    },
  },
  methods: {
    setDebug(value) {
      this.debug = value
    },
    refetchRooms() {
      this.$store.room2.api.markStale()
      this.$store.room2.getPage(this.search_params)
    },
    newRoom() {
      this.editing_room = {
        world: WORLD,
        zone: this.$route.params.zone_id,
        data: {
          zone_bounds: [0, 0, 10, 10],
        },
      }
    },
  },
}
</script>
