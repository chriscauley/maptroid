<template>
  <div :style="style" :class="css" :title="`${room.id} - ${room.name}`">
    <img :src="src" ref="img" @load="draw" style="display:none" />
    <canvas ref="canvas" />
    <unrest-draggable @drag="drag" />
    <div v-for="item in room_items" :key="item.id" v-bind="item" />
  </div>
</template>

<script>
import vec from '@/lib/vec'
const WORLD = 'super_metroid'

export default {
  inject: ['osd_store'],
  props: {
    room: Object,
    mode: String,
    items: Array,
  },
  data() {
    return { drag_xy: [0, 0], drag_raw_xy: [0, 0], backgroundImage: '' }
  },
  computed: {
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
      const zIndex = 100 - width * height
      return {
        backgroundImage: this.backgroundImage,
        height: `${height * 100}%`,
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: `${width * 100}%`,
        zIndex,
      }
    },
    room_items() {
      const width = this.room.data.zone.bounds[2] * 16
      const height = this.room.data.zone.bounds[3] * 16
      return this.items
        .filter((i) => i.room === this.room.id)
        .map((item) => {
          const [x, y] = item.data.room_xy
          return {
            id: `sm-item__${item.id}`,
            class: item.icon,
            title: item.name,
            style: {
              position: 'absolute',
              top: `${(100 * y) / height}%`,
              left: `${(100 * x) / width}%`,
              height: `${100 / height}%`,
              width: `${100 / width}%`,
            },
          }
        })
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
        this.osd_store.dragRoom(this.room, event._drag.last_dxy)
        this.$store.room2.bounceSave(this.room)
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
