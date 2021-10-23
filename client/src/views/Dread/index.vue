<template>
  <div class="app-body">
    <div class="flex-grow">
      <unrest-toolbar :storage="tool_storage" class="-topleft" />
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
          />
          <room-canvas v-for="room in rooms" :key="room.id" :room="room" />
        </html-overlay>
      </template>
    </div>
    <div class="app-panel">
      <div class="app-panel__inner">
        <div>
          <div class="btn -primary" @click="newRoom">New Room</div>
          Rooms: {{ rooms?.length }}
        </div>
        <screenshot-list-item
          v-for="screenshot in screenshots"
          :key="screenshot.id"
          :screenshot="screenshot"
        />
      </div>
    </div>
    <room-form v-if="editing_room" :room="editing_room" @close="editing_room = null" />
  </div>
</template>

<script>
import Openseadragon from 'openseadragon'

import RoomCanvas from './RoomCanvas.vue'
import RoomForm from './RoomForm.vue'
import ScreenshotListItem from './ScreenshotListItem.vue'
import ScreenshotOverlay from './ScreenshotOverlay.vue'
import HtmlOverlay from '@/vue-openseadragon/HtmlOverlay.vue'
import tool_storage from './tools'

const WORLD = 3 // hardcoded for now since this interface is dread only

export default {
  __route: {
    path: '/dread/:zone_id/:zone_slug/',
  },
  components: {
    HtmlOverlay,
    RoomCanvas,
    RoomForm,
    ScreenshotOverlay,
    ScreenshotListItem,
  },
  data() {
    return {
      selected: null,
      editing_room: null,
      canvas_state: {},
      cropped_images: {},
      tool_storage,
    }
  },
  computed: {
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
    screenshots() {
      return this.$store.screenshot.getPage(this.search_params)?.items
    },
    rooms() {
      return this.$store.room2.getPage(this.search_params)?.items
    },
  },
  watch: {
    screenshots() {
      this.screenshots?.forEach((screenshot) => this.$store.osd.addImage(screenshot))
    },
  },
  methods: {
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
