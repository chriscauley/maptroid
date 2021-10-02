<template>
  <div v-if="world" class="flex-grow">
    <world-canvas :world="world" :sources="sources" />
  </div>
</template>

<script>
import WorldCanvas from './WorldCanvas.vue'

const GRID = 8

export default {
  __route: {
    path: '/world-tiles/:world_id/'
  },
  components: { WorldCanvas },
  data() {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 256 * 16
    const world_map = document.createElement('img')
    world_map.src = `/media/world_maps/super_metroid.png`
    world_map.onload = this.draw
    return { canvas, world_map, mouse: { x: 0, y: 0 } }
  },
  computed: {
    world() {
      return this.$store.world2.getOne(this.$route.params.world_id)
    },
    sources() {
      return [
        ctx => ctx.drawImage(this.world_map, 0, 0),
        (ctx, boxy) => {
          ctx.strokeStyle = 'white'
          ctx.linewidth = 2
          const { x, y } = boxy.mouse
          const floor = (n) => GRID * Math.floor(n / GRID)
          ctx.strokeRect(floor(x), floor(y), GRID, GRID)
        }
      ]
    }
  },
  methods: {
    draw() {
      const { width, height } = this.canvas
      const ctx = this.canvas.getContext('2d')
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(this.world_map, 0, 0)
    },
  }
}
</script>