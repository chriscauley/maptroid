<template>
  <div :style="style" :class="css" :title="`${room.id} - ${room.name}`" @click="click">
    <template v-if="mode">
      <div v-for="(hole, i) in holes" :key="i" :style="hole" />
      <unrest-draggable class="doot" @drag="drag" :style="`background-image: url(${src})`" />
    </template>
    <template v-if="mode === 'item'">
      <div
        v-for="item in items"
        v-bind="item.attrs"
        :key="item.id"
        @click.stop="removeItem(item.id)"
      />
    </template>
  </div>
</template>

<script>
import { debounce, inRange } from 'lodash'
import vec from '@/lib/vec'

export default {
  inject: ['osd_store', 'tool_storage'],
  props: {
    room: Object,
    mode: String,
    variant: String,
  },
  computed: {
    css() {
      const { zoom } = this.osd_store.state
      // 0.2 is based off observation
      return [`sm-room-box -mode-${this.mode}`, zoom > 0.2 && 'pixelated']
    },
    src() {
      const { world } = this.$store.route
      return `/media/sm_cache/${world.slug}/layer-2+layer-1/${this.room.key}`
    },
    style() {
      const [x, y, width, height] = this.room.data.zone.bounds
      if (['item', 'overlap'].includes(this.mode)) {
        return {
          height: `${height * 256}px`,
          width: `${width * 256}px`,
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
      return items.map((item) => ({
        id: item.id,
        attrs: {
          id: `sm-room-box__item__${item.id}`,
          class: `sm-item -${item.data.type}`,
          style: {
            height: '16px',
            left: `${16 * item.data.room_xy[0]}px`,
            position: 'absolute',
            top: `${16 * item.data.room_xy[1]}px`,
            width: '16px',
          },
        },
      }))
    },
    holes() {
      if (this.mode !== 'overlap') {
        return []
      }
      const s = 256
      return this.room.data.holes?.map(([x, y]) => ({
        left: `${x * s}px`,
        top: `${y * s}px`,
        width: s + 'px',
        height: s + 'px',
        position: 'absolute',
        background: 'rgba(255,0,0,0.25)',
        zIndex: 1,
        pointerEvents: 'none',
      }))
    },
  },
  methods: {
    click(event) {
      const { tool } = this.tool_storage.state.selected
      const { editing_room } = this.$store.local.state
      if (editing_room !== this.room.id && tool === 'edit_room') {
        this.$store.local.save({ editing_room: this.room.id })
      } else if (this.mode === 'item') {
        const box = this.$el.getBoundingClientRect()
        const { clientX, clientY } = event
        const xy = [clientX - box.x, clientY - box.y].map((i) => Math.floor(i / 16))
        this.addItem(xy)
      }
    },
    bounceSave: debounce(function() {
      this.$store.room2.save(this.room).then(this.$store.route.refetchRooms)
    }, 500),
    drag(event) {
      if (this.mode === 'overlap') {
        const box = this.$el.getBoundingClientRect()
        const [x, y] = event._drag.xy
        if (inRange(x - box.x, 0, box.width) && inRange(y - box.y, 0, box.height)) {
          const xy = [x - box.x, y - box.y].map((i) => Math.floor(i / 256))
          this[event.shiftKey ? 'removeHole' : 'addHole'](xy)
        }
      } else if (this.mode === 'item') {
        // handled in click
      } else {
        this.osd_store.dragRoom(this.room, event._drag.last_dxy)
        this.bounceSave()
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
    addItem(xy) {
      const data = {
        room: this.room.id,
        zone: this.room.zone,
        data: { room_xy: xy, type: this.variant },
      }
      this.$store.item2.save(data).then(this.$store.route.refetchItems)
    },
    removeItem(id) {
      this.$store.item2.delete({ id }).then(this.$store.route.refetchItems)
    },
  },
}
</script>
