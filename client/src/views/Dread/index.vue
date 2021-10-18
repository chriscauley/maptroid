<template>
  <div class="app-body">
    <div class="flex-grow">
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
            v-for="screenshot in visible_screenshots"
            :key="screenshot.id"
            :screenshot="screenshot"
          />
        </html-overlay>
      </template>
    </div>
    <div class="app-panel">
      <div class="app-panel__inner">
        <div class="app-panel__pagination" style="display:flex">
          <div v-for="page in pages" :key="page.number" v-bind="page">{{ page.number }}</div>
        </div>
        <screenshot-list-item
          v-for="screenshot in screenshot_page?.items"
          :key="screenshot.id"
          :screenshot="screenshot"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { range } from 'lodash'
import Openseadragon from 'openseadragon'

import ScreenshotListItem from './ScreenshotListItem.vue'
import ScreenshotOverlay from './ScreenshotOverlay.vue'
import HtmlOverlay from '@/vue-openseadragon/HtmlOverlay.vue'

const ZONE = 1

export default {
  components: { HtmlOverlay, ScreenshotOverlay, ScreenshotListItem },
  data() {
    return {
      // const tool_storage = Storage('dread-tools')
      selected: null,
      canvas_state: {},
      cropped_images: {},
      current_page: 1,
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
    pages() {
      const { pages = 0, page } = this.screenshot_page || {}
      return range(1, 1 + pages).map((number) => ({
        number,
        class: ['btn -link', number === page && '-current'],
        onClick: () => (this.current_page = number),
      }))
    },
    screenshot_page() {
      return this.$store.screenshot.getPage({ page: this.current_page })
    },
    visible_screenshots() {
      return (this.screenshot_page?.items || []).filter((s) => s.zone === ZONE)
    },
    anchors() {
      return this.visible_screenshots.map((screenshot) => {
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
  },
  watch: {
    visible_screenshots() {
      this.visible_screenshots.forEach((screenshot) => {
        if (screenshot.zone === ZONE) {
          this.$store.osd.addImage(screenshot)
        }
      })
    },
  },
  methods: {
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
