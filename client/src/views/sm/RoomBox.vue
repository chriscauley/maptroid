<template>
  <div :style="style" :class="css" :title="`${room.id} - ${room.name}`">
    <template v-if="mode">
      <img :src="src" ref="img" @load="draw" style="display:none" />
      <canvas ref="canvas" />
      <unrest-draggable @drag="drag" />
    </template>
    <div v-for="attrs in items" :key="attrs.id" v-bind="attrs" />
    <svg v-if="tool_storage.state.show_svg" :viewBox="viewBox">
      <path v-for="(shape, i) in shapes" :key="i" :d="shape" />
      <rect v-for="(r, i) in rectangles" :key="i" v-bind="r" />
    </svg>
  </div>
</template>

<script>
import vec from '@/lib/vec'
import prepItem from './prepItem'

const WORLD = 'super_metroid'

const getPoints = (type) => {
  return type
    .slice(2)
    .split('')
    .map((i) => parseInt(i))
    .map((i) => [(i % 3) / 2, Math.floor(i / 3) / 2])
}

export default {
  inject: ['osd_store', 'tool_storage'],
  props: {
    room: Object,
    mode: String,
  },
  data() {
    return { drag_xy: [0, 0], drag_raw_xy: [0, 0], backgroundImage: '' }
  },
  computed: {
    viewBox() {
      const [_x, _y, width, height] = this.room.data.zone.bounds
      if (width > height) {
        return `0 0 100 ${(100 * height) / width}`
      }
      return `0 0 ${(100 * width) / height} 100`
    },
    shapes() {
      const [_x, _y, width, height] = this.room.data.zone.bounds
      let _percent = 100 / (height * 16)
      if (width > height) {
        _percent = 100 / (width * 16)
      }
      return this.room.data.bts.shapes.map(([type, xy]) => {
        let points = getPoints(type).map((p) => [p[0] + xy[0], p[1] + xy[1]])
        points = points.map((p) => [p[0] * _percent, p[1] * _percent])
        const ls = points.map((p) => `L ${p}`)
        return `M ${points[points.length - 1]} ${ls}`
      })
    },
    rectangles() {
      const [_x, _y, width, height] = this.room.data.zone.bounds
      const x_percent = 100 / (width * 16)
      const y_percent = 100 / (height * 16)
      return this.room.data.bts.rectangles.map(([x, y, width, height]) => ({
        x: `${x * x_percent}%`,
        y: `${y * y_percent}%`,
        width: `${width * x_percent}%`,
        height: `${height * y_percent}%`,
      }))
    },
    css() {
      const { zoom } = this.osd_store.state
      // 0.2 is based off observation
      return [`sm-room-box -mode-${this.mode}`, zoom > 0.2 && 'pixelated']
    },
    src() {
      const { sm_layer } = this.$store.local.state
      return `/media/smile_exports/${WORLD}/${sm_layer}/${this.room.key}`
    },
    style() {
      const [x, y, width, height] = this.room.data.zone.bounds
      if (this.mode === 'overlap') {
        return {
          backgroundImage: this.backgroundImage,
          height: `${height * 64}px`,
          width: `${width * 64}px`,
        }
      }
      return {
        height: `${height * 100}%`,
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: `${width * 100}%`,
      }
    },
    items() {
      const items = this.$store.route.world_items.filter((i) => i.room === this.room.id)
      return items.map((i) => prepItem(i, this.room))
    },
  },
  methods: {
    drag(event) {
      if (this.mode === 'overlap') {
        const box = this.$el.getBoundingClientRect()
        const [x, y] = event._drag.xy
        const xy = [x - box.x, y - box.y].map((i) => Math.floor(i / 64))
        this[event.shiftKey ? 'removeHole' : 'addHole'](xy)
      } else {
        if (event.ctrlKey) {
          this.show_bts = !this.show_bts
        } else {
          this.osd_store.dragRoom(this.room, event._drag.last_dxy)
          this.$store.room2.bounceSave(this.room)
        }
      }
    },
    draw() {
      const [_x, _y, width, height] = this.room.data.zone.bounds
      const { canvas, img } = this.$refs
      canvas.width = width * 256
      canvas.height = height * 256
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      this.room.data.holes?.forEach(([x, y]) => {
        ctx.clearRect(x * 256, y * 256, 256, 256)
      })
      this.backgroundImage = `url("${canvas.toDataURL()}")`
    },
    addHole(xy) {
      const { holes } = this.room.data
      if (!holes.find((xy2) => vec.isEqual(xy, xy2))) {
        holes.push(xy)
        this.draw()
        this.$store.room2.bounceSave(this.room)
      }
    },
    removeHole(xy) {
      const { holes } = this.room.data
      if (holes.find((xy2) => vec.isEqual(xy, xy2))) {
        holes = holes.filter((xy2) => !vec.isEqual(xy, xy2))
        this.draw()
        this.$store.room2.bounceSave(this.room)
      }
    },
  },
}
</script>
