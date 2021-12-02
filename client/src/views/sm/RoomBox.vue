<template>
  <div :style="style" :class="css" :title="`${room.id} - ${room.name}`" @click="click">
    <template v-if="mode">
      <unrest-draggable @drag="drag" :style="`background-image: url(${src})`" />
    </template>
    <div v-for="(hole, i) in holes" :key="i" :style="hole" />
    <div
      v-show="tool_storage.state.show_items"
      v-for="attrs in items"
      :key="attrs.id"
      v-bind="attrs"
    />
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
    return { drag_xy: [0, 0], drag_raw_xy: [0, 0] }
  },
  computed: {
    css() {
      const { zoom } = this.osd_store.state
      // 0.2 is based off observation
      return [`sm-room-box -mode-${this.mode}`, zoom > 0.2 && 'pixelated']
    },
    src() {
      return `/media/sm_cache/${WORLD}/layer-1/${this.room.key}`
    },
    style() {
      const [x, y, width, height] = this.room.data.zone.bounds
      if (this.mode === 'overlap') {
        return {
          height: `${height * 64}px`,
          width: `${width * 64}px`,
        }
      }
      return {
        height: `${height * 100}%`,
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: `${width * 100}%`,
        zIndex: 100 - width * height,
      }
    },
    items() {
      const items = this.$store.route.world_items.filter((i) => i.room === this.room.id)
      return items.map((i) => prepItem(i, this.room))
    },
    holes() {
      if (this.mode !== 'overlap') {
        return []
      }
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
      if (data.holes.find((xy2) => vec.isEqual(xy, xy2))) {
        data.holes = data.holes.filter((xy2) => !vec.isEqual(xy, xy2))
        this.$store.room2.bounceSave(this.room)
      }
    },
  },
}
</script>
