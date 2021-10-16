<template>
  <div class="app-body">
    <div class="flex-grow">
      <unrest-toolbar :storage="tool_storage" class="-topleft" />
      <unrest-canvas :sources="sources" />
    </div>
    <div class="app-panel">
      <div class="app-panel__inner">
        <div
          v-for="screenshot in screenshot_page?.items"
          :key="screenshot.id"
          @click="selected=screenshot">
          <img :src="screenshot.image" :id="`screenshot__${screenshot.id}`" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import UnrestCanvas from '@/components/UnrestCanvas/index.vue'
import Storage from '@/components/UnrestCanvas/tool_storage'

import UnrestToolbar from '@/components/UnrestToolbar.vue'

const tool_storage = Storage('dread-tools')

export default {
  components: { UnrestCanvas, UnrestToolbar },
  data() {
    return { selected: null, tool_storage }
  },
  computed: {
    screenshot_page() {
      return this.$store.screenshot.getPage()
    },
    sources() {
      const sources = []
      if (this.selected) {
        sources.push({
          draw: (ctx) => {
            const image = document.getElementById(`screenshot__${this.selected.id}`)
            ctx.drawImage(image, 0, 0)
          }
        })
      }
      return sources
    }
  }
}
</script>