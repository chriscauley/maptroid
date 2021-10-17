<template>
  <div class="app-body">
    <div class="flex-grow">
      <world-canvas :world="world" :sources="sources" />
    </div>
    <div class="app-panel list-group">
      <div class="list-group-item">
        <div
          v-for="layer in layers"
          :key="layer"
          :class="css.layer(layer)"
          @click="selected.layer = layer"
        >
          {{ layer }}
        </div>
      </div>
      <div
        v-for="room in rooms"
        :key="room.id"
        class="list-group-item"
        @click="selected.room = room"
      >
        <div>
          <div>{{ room.key }}</div>
          <img
            v-if="selected.room === room"
            :src="`/media/smile_exports/${world.slug}/${selected.layer}/${room.key}`"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import WorldCanvas from './WorldCanvas.vue'

const GRID = 8

const layers = [
  'layer-1',
  'layer-2',
  // 'plm_enemies',
  'bts',
]

export default {
  __route: {
    path: '/world-tiles/:world_id/',
  },
  components: { WorldCanvas },
  data() {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 256 * 16
    const world_map = document.createElement('img')
    world_map.src = `/media/world_maps/super_metroid.png`
    world_map.onload = this.draw
    return {
      selected: {
        layer: layers[0],
        room: undefined,
      },
      canvas,
      world_map,
      mouse: { x: 0, y: 0 },
      layers,
    }
  },
  computed: {
    css() {
      return {
        layer: (layer) => ['btn', layer === this.selected.layer ? '-primary' : '-secondary'],
      }
    },
    world() {
      return this.$store.world2.getOne(this.$route.params.world_id)
    },
    rooms() {
      const results = this.$store.room2.getPage({
        query: { world_id: this.$route.params.world_id, per_page: 5000 },
      })
      return results?.items || []
    },
    sources() {
      return [
        (ctx) => ctx.drawImage(this.world_map, 0, 0),
        (ctx, boxy) => {
          ctx.strokeStyle = 'white'
          ctx.linewidth = 2
          const { x, y } = boxy.mouse
          const floor = (n) => GRID * Math.floor(n / GRID)
          ctx.strokeRect(floor(x), floor(y), GRID, GRID)
        },
      ]
    },
  },
  methods: {
    draw() {
      const { width, height } = this.canvas
      const ctx = this.canvas.getContext('2d')
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(this.world_map, 0, 0)
    },
  },
}
</script>
