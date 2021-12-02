<template>
  <div :style="style" :class="css" :title="`${room.id} - ${room.name}`" @click="click">
    <template v-if="mode">
      <img :src="src" ref="img" style="position: absolute" />
      <div v-for="(hole, i) in holes" :key="i" :style="hole" />
      <unrest-draggable @drag="drag" />
    </template>
    <div v-for="attrs in items" :key="attrs.id" v-bind="attrs" />
    <svg :viewBox="viewBox2" class="sm-room-svg">
      <path v-for="(shape, i) in shapes.outer" :d="shape" class="-outer" :key="i" />
      <path v-for="(shape, i) in shapes.inner" :d="shape" class="-inner" :key="i" />
    </svg>
  </div>
</template>

<script>
import vec from '@/lib/vec'
import prepItem from './prepItem'

const WORLD = 'super_metroid'

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
    viewBox2() {
      const [_x, _y, width, height] = this.room.data.zone.bounds
      return `0 0 ${width} ${height}`
    },
    shapes() {
      const { outer, inner } = this.room.data.geometry
      return {
        outer: outer.map(this.getD),
        inner: inner.map(this.getD),
      }
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
    holes() {
      const s = 64
      return this.room.data.holes?.map(([x, y]) => ({
        left: `${x * s}px`,
        top: `${y * s}px`,
        width: s + 'px',
        height: s + 'px',
        position: 'absolute',
        background: 'rgba(255,0,0,0.25)',
      }))
    },
  },
  methods: {
    click() {
      const { tool } = this.tool_storage.state.selected
      const { overlap_room } = this.$store.local.state
      if (overlap_room !== this.room.id && tool === 'edit_room') {
        this.$store.local.save({ overlap_room: this.room.id })
      }
    },
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
    addHole(xy) {
      const { holes } = this.room.data
      if (!holes.find((xy2) => vec.isEqual(xy, xy2))) {
        holes.push(xy)
        this.$store.room2.bounceSave(this.room)
      }
    },
    removeHole(xy) {
      const { data } = this.room
      if (find((xy2) => vec.isEqual(xy, xy2))) {
        data.holes = data.holes.filter((xy2) => !vec.isEqual(xy, xy2))
        this.$store.room2.bounceSave(this.room)
      }
    },
    getD(shape) {
      const _d = (points) => {
        const ls = points.map((p) => `L ${p}`)
        return `M ${points[points.length - 1]} ${ls}`
      }
      return `${_d(shape.exterior)} ${shape.interiors.map(_d).join(' ')}`
    },
  },
}
</script>
