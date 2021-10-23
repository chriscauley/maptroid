<template>
  <div class="app-body">
    <div class="ur-wrapper">
      <div v-if="screenshot" class="ur-inner">
        <unrest-toolbar :storage="tool_storage" />
        <unrest-mouse-tracker
          :width="width"
          :items="grid_items"
          @click="click"
          @mousemove.prevent="mousemove"
        >
          <div class="grid__16-5">
            <img class="max-w-unset" :src="screenshot.output" @load="onLoad" />
          </div>
        </unrest-mouse-tracker>
      </div>
    </div>
    <div class="app-panel"></div>
    <breadcrumbs
      :zone="zone"
      :zones="zones"
      :screenshot="screenshot"
      :zone_screenshots="zone_screenshots"
    />
  </div>
</template>

<script>
import Breadcrumbs from './Breadcrumbs.vue'
import tool_storage from './tool_storage'
const WORLD = 3 // TODO world hardcoded as dread

const _xy = (() => {
  const cache = {}
  return (xy) => {
    if (!cache[xy]) {
      cache[xy] = xy.split(',').map((i) => Number(i))
    }
    return cache[xy]
  }
})()

export default {
  __route: {
    path: '/screenshot/analyzer/:zone_id?/:screenshot_id?/',
  },
  components: { Breadcrumbs },
  data() {
    return { width: 1, items: [], tool_storage }
  },
  computed: {
    zones() {
      const q = { query: { per_page: 5000, world: WORLD } }
      return this.$store.zone.getPage(q)?.items.map((zone) => ({
        ...zone,
        to: `/screenshot/analyzer/${zone.id}/`,
        text: zone.name,
      }))
    },
    zone_id() {
      return parseInt(this.$route.params.zone_id)
    },
    zone() {
      return this.zones?.find((z) => z.id === this.zone_id)
    },
    zone_screenshots() {
      if (!this.zone_id) {
        return
      }
      const q = { query: { per_page: 5000, world: WORLD, zone: this.zone_id } }
      return this.$store.screenshot.getPage(q)?.items.map((screenshot) => ({
        text: screenshot.id,
        to: `/screenshot/analyzer/${this.zone_id}/${screenshot.id}/`,
        ...screenshot,
      }))
    },
    screenshot() {
      const screenshot_id = parseInt(this.$route.params.screenshot_id)
      return this.zone_screenshots?.find((s) => s.id === screenshot_id)
    },
    grid_items() {
      return Object.entries(this.screenshot.data.human.entities).map(([xy, type]) => ({
        xy: _xy(xy),
        class: `dread-square -type_${type}`,
      }))
    },
  },
  methods: {
    onLoad(event) {
      this.width = event.target.width / 16.5
    },

    click(event) {
      const { selected_tool } = this.tool_storage.state
      if (['wall', 'door'].includes(selected_tool)) {
        if (event.shiftKey) {
          this.removeXY(event)
        } else {
          this.setXY(event)
        }
      }
    },

    mousemove(event) {
      if (event.which === 1) {
        this.click(event)
      }
    },

    setXY(event) {
      const { x, y } = event.grid
      const { selected_tool, selected_variant } = this.tool_storage.state
      if (selected_variant === 'trash') {
        this.removeXY(event)
      } else {
        const type = `${selected_tool}_${selected_variant}`
        this.$store.screenshot.setItemAtXY(this.screenshot, [x, y], type)
      }
    },

    removeXY(event) {
      const { x, y } = event.grid
      this.$store.screenshot.setItemAtXY(this.screenshot, [x, y], null)
    },
  },
}
</script>
