<template>
  <div class="app-body">
    <div class="ur-wrapper">
      <div v-if="screenshot" class="ur-inner">
        <unrest-toolbar :storage="tool_storage" style="position: fixed; left: 0; top: 76px;" />
        <unrest-mouse-tracker
          :width="width"
          :items="grid_items"
          @click="click"
          @mousemove.prevent="mousemove"
          style="margin-top: 70px;"
        >
          <div class="screenshot-analyzer__grid" ref="grid" :style="grid_style" />
          <img class="max-w-unset" :src="screenshot.output" @load="onLoad" :style="image_style" />
          <div class="screenshot-analyzer__debug">
            {{ debug_text }}
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
import Mousetrap from '@unrest/vue-mousetrap'
import tool_storage from './tool_storage'
const WORLD = 3 // TODO world hardcoded as dread

export const PX_PER_GRID = 16.5

const _xy = (() => {
  const cache = {}
  return (xy) => {
    if (!cache[xy]) {
      cache[xy] = xy.split(',').map((i) => Number(i))
    }
    return cache[xy]
  }
})()

const dxys = {
  up: [0, -1],
  down: [0, 1],
  right: [1, 0],
  left: [-1, 0],
}

export default {
  components: { Breadcrumbs },
  mixins: [Mousetrap.Mixin],
  __route: {
    path: '/screenshot/analyzer/:zone_id?/:screenshot_id?/',
  },
  data() {
    return { width: 1, items: [], tool_storage }
  },
  computed: {
    grid_style() {
      const canvas = document.createElement('canvas')
      const s = (canvas.width = canvas.height = Math.floor(PX_PER_GRID))
      const ctx = canvas.getContext('2d')
      const { selected_tool } = this.tool_storage.state
      ctx.fillStyle = selected_tool === 'regrid' ? 'white' : 'black'
      ctx.rect(s - 1, 0, s, s)
      ctx.rect(0, s - 1, s, s)
      ctx.fill()
      return {
        backgroundImage: `url(${canvas.toDataURL()})`,
        backgroundSize: PX_PER_GRID + 'px',
      }
    },
    image_style() {
      const [x, y] = this.shifts.delta
      return {
        left: -x + 'px',
        position: 'relative',
        top: -y + 'px',
        zIndex: -1,
      }
    },
    mousetrap() {
      const { selected_tool } = this.tool_storage.state
      if (selected_tool === 'regrid') {
        return {
          'up,down,left,right': this.moveGrid,
        }
      }
      return {}
    },
    shifts() {
      const shifts = {
        output: this.screenshot?.data.output?.shift || [0, 0],
        human: this.screenshot?.data.human?.shift,
      }
      shifts.human = shifts.human || [...shifts.output]
      shifts.delta = [shifts.human[0] - shifts.output[0], shifts.human[1] - shifts.output[1]]
      return shifts
    },
    debug_text() {
      const { selected_tool } = this.tool_storage.state
      if (selected_tool === 'regrid') {
        const { output, human, delta } = this.shifts
        return `human(${human}) - output(${output}) = delta(${delta})`
      }
      return ''
    },
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
      this.width = event.target.width / PX_PER_GRID
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

    moveGrid(event) {
      event.preventDefault()
      const dxy = dxys[event.key.toLowerCase().replace('arrow', '')]
      if (!this.screenshot.data.human.shift) {
        this.screenshot.data.human.shift = [...this.screenshot.data.output.shift]
      }
      const { shift } = this.screenshot.data.human
      shift[0] -= dxy[0]
      shift[1] -= dxy[1]
    },
  },
}
</script>
