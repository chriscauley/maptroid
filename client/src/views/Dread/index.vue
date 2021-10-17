<template>
  <div class="app-body">
    <div class="flex-grow">
      <!-- <unrest-toolbar :storage="tool_storage" class="-topleft" /> -->
      <unrest-canvas :sources="sources" :state="canvas_state" />
      <unrest-draggable v-for="(anchor, i) in anchors" :key="i" v-bind="anchor">
        <i class="fa fa-anchor" />
      </unrest-draggable>
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
import ScreenshotListItem, { img_cache } from './ScreenshotListItem.vue'

import UnrestCanvas from '@/components/UnrestCanvas/index.vue'
// import Storage from '@/components/UnrestCanvas/tool_storage'
// import UnrestToolbar from '@/components/UnrestToolbar.vue'

const ZONE = 1

export default {
  components: { ScreenshotListItem, UnrestCanvas }, //, UnrestToolbar },
  data() {
    return {
      // const tool_storage = Storage('dread-tools')
      selected: null,
      active_screenshots: [],
      canvas_state: {},
      cropped_images: {},
      page: 1,
    }
  },
  computed: {
    pages() {
      const { pages = 0, page } = this.screenshot_page || {}
      return range(1, 1 + pages).map((number) => ({
        number,
        class: ['btn -link', number === page && '-current'],
        onClick: () => (this.page = number),
      }))
    },
    screenshot_page() {
      return this.$store.screenshot.getPage({ page: this.page })
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
    sources() {
      const sources = []
      this.visible_screenshots.forEach((screenshot) => {
        sources.push({
          draw: (ctx) => {
            const [x, y] = screenshot.data.zone_xy
            ctx.drawImage(img_cache[screenshot.id], x, y)
          },
        })
      })
      return sources
    },
  },
  methods: {
    dragAnchor(screenshot, dxy) {
      screenshot.data.zone_xy[0] += dxy[0]
      screenshot.data.zone_xy[1] += dxy[1]
    },
  },
}
</script>
