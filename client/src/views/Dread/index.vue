<template>
  <div class="app-body">
    <div class="flex-grow">
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
      <open-seadragon
        @mousewheel.prevent="osdWheel"
        :options="osd_options"
        :callback="bindViewer"
        class="dread-viewer"
        :pixelated="true"
      />
      <template v-if="$store.osd.viewer">
        <html-overlay>
          <screenshot-overlay
            v-for="screenshot in screenshots"
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
      <group-manager
        v-if="managing_groups"
        @close="managing_groups = null"
        :screenshots="screenshots"
      />
    </div>
    <!-- <div class="app-panel"> -->
    <!--   <div class="app-panel__inner"> -->
    <!--     <div> -->

    <!--       Rooms: {{ rooms?.length }} -->
    <!--     </div> -->
    <!--     <screenshot-list-item -->
    <!--       v-for="screenshot in screenshots" -->
    <!--       :key="screenshot.id" -->
    <!--       :screenshot="screenshot" -->
    <!--     /> -->
    <!--   </div> -->
    <!-- </div> -->
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
import Openseadragon from 'openseadragon'
import { sortBy, startCase } from 'lodash'

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
    GroupManager,
    HtmlOverlay,
    RoomCanvas,
    RoomForm,
    ScreenshotOverlay,
  },
  data() {
    return {
      screenshots: [],
      selected: null,
      editing_room: null,
      canvas_state: {},
      cropped_images: {},
      tool_storage,
      managing_groups: false,
      debug: '',
    }
  },
  computed: {
    room_mode() {
      const { selected_tool, selected_variant } = tool_storage.state
      return selected_tool === 'room' ? selected_variant : undefined
    },
    osd_options() {
      return {
        maxZoomPixelRatio: 8,
        showNavigator: true,
        showZoomControl: false,
        showHomeControl: false,
        showFullPageControl: false,
        showRotationControl: false,
        debugmode: false,
        clickTimeThreshold: 1000,
        mouseNavEnabled: false,
        gestureSettingsMouse: {
          clickToZoom: false,
          dblClickToZoom: false,
        },
      }
    },
    anchors() {
      return this.screenshots.map((screenshot) => {
        const { width, height, zone_xy } = screenshot.data
        const top = height / 2 + zone_xy[1]
        const left = width / 2 + zone_xy[0]
        return {
          onDrag: (state) => this.dragAnchor(screenshot, state.last_dxy),
          class: 'dread-anchor',
          style: { top: top + 'px', left: left + 'px' },
        }
      })
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
  mounted() {
    window.$store = this.$store
    this.$store.screenshot.fetchPage(this.search_params).then(({ items }) => {
      const { limit, sort_from, show_all = false } = this.$route.query

      // Because of the top gradient in the Dread map viewer, we need ot put down bottommost pieces first
      // sort from bottom to put top most pieces on top
      items = sortBy(items, 'data._world.xy.1')
      items.reverse()

      if (!show_all) {
        items = items.filter((i) => i.data._world?.group !== 8)
      }
      if (limit && sort_from) {
        let limited = []
        const rest = []
        items.forEach((i) => (i.data._world?.group === 1 ? limited : rest).push(i))
        const sort_index = ['right', 'left'].includes(sort_from) ? 0 : 1
        limited = sortBy(limited, `data._world.xy.${sort_index}`)
        if (['bottom', 'right'].includes(sort_from)) {
          limited.reverse()
        }
        items = limited.slice(0, parseInt(limit)).concat(rest)
      }
      this.screenshots = items
      this.screenshots.forEach((screenshot) => this.$store.osd.addImage(screenshot))
    })
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
    dragAnchor(screenshot, dxy) {
      screenshot.data.zone_xy[0] += dxy[0]
      screenshot.data.zone_xy[1] += dxy[1]
    },
    bindViewer(viewer) {
      this.$store.osd.viewer = viewer
    },
    osdWheel(event) {
      // Loosely adapted from OSD.Viewer.onCanvasDragEnd and OSD.viewer.onCanvasScroll
      const viewer = this.$store.osd.viewer
      const viewport = viewer.viewport
      if (event.ctrlKey) {
        const box = viewer.container.getBoundingClientRect()
        const position = new Openseadragon.Point(event.pageX - box.left, event.pageY - box.top)
        const factor = Math.pow(viewer.zoomPerScroll, event.deltaY / 10)
        viewport.zoomBy(factor, viewport.pointFromPixel(position, true))
      } else {
        var center = viewport.pixelFromPoint(viewport.getCenter(true))
        var target = viewport.pointFromPixel(
          new Openseadragon.Point(center.x + 2 * event.deltaX, center.y + 2 * event.deltaY),
        )
        viewport.panTo(target, false)
      }
      viewport.applyConstraints()
    },
  },
}
</script>
