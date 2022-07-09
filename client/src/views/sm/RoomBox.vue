<template>
  <div :style="style" :class="css" :title="`${room.id} - ${room.name}`" @click="click">
    <template v-if="mode">
      <div v-for="(hole, i) in holes" :key="i" :style="hole" />
      <unrest-draggable @drag="drag" :style="`background-image: url(${src})`" />
    </template>
    <template v-if="mode === 'item'">
      <div
        v-for="item in items"
        v-bind="item.attrs"
        :key="item.id"
        @click.stop="removeItem(item.id)"
      />
    </template>
    <template v-if="['block', 'plm'].includes(mode)">
      <div v-for="block in blocks" v-bind="block.attrs" :key="block.id" />
      <div
        v-for="override in cre_overrides"
        v-bind="override"
        :key="override.id"
        @click.stop="deleteOverride(override.id)"
      />
      <div
        v-for="block in plm_blocks"
        v-bind="block.attrs"
        :key="block.id"
        @click.stop="deletePlm(block.xy)"
      />
    </template>
    <template v-if="mode === 'link'">
      <div v-for="link in links" v-bind="link.attrs" :key="link.key" @click.stop="deleteLink(link)">
        {{ link.text }}
      </div>
    </template>
    <div v-if="drag_bounds" v-bind="drag_bounds_attrs" />
  </div>
</template>

<script>
import { debounce, inRange, range } from 'lodash'
import vec from '@/lib/vec'
import Room from '@/models/Room'
import template_sprites from '@/../../server/static/sm/icons/template_sprites.json'

export const plms = {}

Object.values(template_sprites).forEach((sprite_list) => {
  sprite_list.forEach(([type, width, height]) => (plms[type] = { type, width, height }))
})

export default {
  inject: ['osd_store', 'tool_storage'],
  props: {
    room: Object,
    mode: String,
    variant: String,
    layer: String,
    highlight: Boolean,
  },
  data() {
    return { drag_bounds: null, ctrl_down: false }
  },
  computed: {
    css() {
      const { zoom } = this.osd_store.state
      // 0.2 is based off observation
      return [
        `sm-room-box -mode-${this.mode}`,
        zoom > 0.2 && 'pixelated',
        this.highlight && '-highlight',
      ]
    },
    src() {
      const { world } = this.$store.route
      const { layer = 'layer-2+layer-1' } = this
      return `/media/sm_cache/${world.slug}/${layer}/${this.room.key}`
    },
    style() {
      const [x, y, width, height] = this.room.data.zone.bounds
      if (['item', 'overlap', 'block', 'plm', 'link'].includes(this.mode)) {
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
    drag_bounds_attrs() {
      const [x, y, w, h] = this.drag_bounds
      return {
        class: ['sm-room-box__drag-bounds', this.ctrl_down && '-ctrl'],
        style: {
          height: `${16 * h}px`,
          left: `${16 * x}px`,
          position: 'absolute',
          top: `${16 * y}px`,
          width: `${16 * w}px`,
        },
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
    plm_blocks() {
      const room_width = this.room.data.zone.bounds[2] * 16
      return Object.entries(this.room.data.plm_overrides || {}).map(([xy, type]) => {
        const [x, y] = xy.split(',').map((i) => Number(i))
        const id = room_width * y + x
        return {
          id,
          xy,
          attrs: {
            class: `sm-block -${type} sm-room-box__override`,
            style: {
              left: `${16 * x}px`,
              position: 'absolute',
              top: `${16 * y}px`,
            },
          },
        }
      })
    },
    blocks() {
      const room_width = this.room.data.zone.bounds[2] * 16
      const block_map = Room.getBlocks(this.room)
      return Object.entries(block_map).map(([xy, _class]) => {
        const [x, y] = xy.split(',').map((i) => Number(i))
        const id = room_width * y + x
        return {
          id,
          attrs: {
            id: `sm-room-box__block__${id}`,
            class: _class,
            style: {
              height: '16px',
              left: `${16 * x}px`,
              position: 'absolute',
              top: `${16 * y}px`,
              width: '16px',
            },
          },
        }
      })
    },
    cre_overrides() {
      return this.room.data.cre_overrides?.map(([x, y, w, h, _name, respawn], id) => ({
        id,
        class: ['sm-room-box__override', { '-respawn': respawn }],
        style: this._style(x, y, w, h),
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
    links() {
      return Object.entries(this.room.data.links || {}).map(([xy, entity]) => {
        xy = xy.split(',').map(Number)
        return {
          id: `link__${xy}`,
          xy,
          text: entity.text,
          attrs: {
            class: `sm-link -${entity.color}`,
            style: this._style(xy[0], xy[1], 2, 2),
          },
        }
      })
    },
  },
  methods: {
    _style(x, y, w, h) {
      return {
        height: `${16 * h}px`,
        left: `${16 * x}px`,
        position: 'absolute',
        top: `${16 * y}px`,
        width: `${16 * w}px`,
      }
    },
    _getMouseXY(clientX, clientY) {
      const box = this.$el.getBoundingClientRect()
      return [clientX - box.x, clientY - box.y].map((i) => Math.floor(i / 16))
    },
    click(event) {
      const { tool, variant } = this.tool_storage.state.selected
      const { editing_room } = this.$store.local.state
      if (tool === 'rezone') {
        if (!(event.shiftKey && event.ctrlKey)) {
          this.$ui.alert('Error: you must hold shift + ctrl to use this tool')
        } else {
          const room = this.room
          room.zone = variant
          this.$store.room.save(room)
        }
      } else if (editing_room !== this.room.id && tool === 'edit_room') {
        this.$store.local.save({ editing_room: this.room.id })
      } else if (this.mode === 'item') {
        this.addItem(this._getMouseXY(event.clientX, event.clientY))
      } else if (this.mode === 'block') {
        const [x, y, w, h] = this.drag_bounds
        const { data } = this.room
        data.cre_overrides = data.cre_overrides || []
        if (this.ctrl_down) {
          const block_map = Room.getBlocks(this.room)
          const targets = {}
          range(x, x + w + 1, 1).forEach((xt) => {
            range(y, y + h + 1, 1).forEach((yt) => {
              const key = `${xt},${yt}`
              if (['sm-cre-hex -unknown', 'sm-cre-hex -respawn'].includes(block_map[key])) {
                targets[key] = [xt, yt, key]
              }
            })
          })
          const _v = Room.findVerticalRects(targets)
          const _h = Room.findHorizontalRects(targets)
          const rects = Object.keys(_h).length > Object.keys(_v).length ? _v : _h
          Object.values(rects).forEach(([x, y, w, h]) => {
            data.cre_overrides.push([x, y, w, h, this.variant])
          })
          this.$ui.toast.info(`Added ${Object.keys(rects).length} ${this.variant}s`)
        } else {
          data.cre_overrides.push([x, y, w, h, this.variant])
        }
        this.bounceSave()
        this.drag_bounds = null
      } else if (this.mode === 'plm') {
        const [x, y] = this._getMouseXY(event.clientX, event.clientY)
        const { data } = this.room
        data.plm_overrides[[x, y]] = this.variant
        this.bounceSave()
      } else if (this.mode === 'link') {
        const [x, y] = this._getMouseXY(event.clientX, event.clientY)
        const { data } = this.room
        data.links = data.links || {}
        const text = window.prompt('Please enter a name')
        data.links[[x, y]] = { type: 'link', color: this.variant, text }
        this.bounceSave()
      }
      this.ctrl_down = false
    },
    bounceSave: debounce(function() {
      this.$store.local.save({ loading: true })
      this.$store.room
        .save(this.room)
        .then(this.$store.route.refetchRooms)
        .then(() => this.$store.local.save({ loading: false }))
    }, 2000),
    fastSave: debounce(function() {
      this.$store.room.save(this.room).then(this.$store.route.refetchRooms)
    }, 500),
    drag(event) {
      this.ctrl_down = event.ctrlKey
      const { tool } = this.tool_storage.state.selected
      if (tool === 'rezone') {
        return
      } else if (this.mode === 'overlap') {
        const box = this.$el.getBoundingClientRect()
        const [x, y] = event._drag.xy
        if (inRange(x - box.x, 0, box.width) && inRange(y - box.y, 0, box.height)) {
          const xy = [x - box.x, y - box.y].map((i) => Math.floor(i / 256))
          this[event.shiftKey ? 'removeHole' : 'addHole'](xy)
        }
      } else if (this.mode === 'item' || this.mode === 'plm') {
        // handled in click
      } else if (this.mode === 'block') {
        const [x1, y1] = this._getMouseXY(...event._drag.xy_start)
        const [x2, y2] = this._getMouseXY(...event._drag.xy)
        const x = Math.min(x1, x2)
        const y = Math.min(y1, y2)
        const w = Math.abs(x2 - x1) + 1
        const h = Math.abs(y2 - y1) + 1
        this.drag_bounds = [x, y, w, h]
      } else if (tool === 'move_room') {
        this.osd_store.dragRoom(this.room, event._drag.last_dxy)
        this.fastSave()
      }
    },
    addHole(xy) {
      const { holes } = this.room.data
      if (!holes.find((xy2) => vec.isEqual(xy, xy2))) {
        holes.push(xy)
        this.$store.room.bounceSave(this.room)
      }
    },
    removeHole(xy) {
      const { data } = this.room
      if (data.holes.find((xy2) => vec.isEqual(xy, xy2))) {
        data.holes = data.holes.filter((xy2) => !vec.isEqual(xy, xy2))
        this.$store.room.bounceSave(this.room)
      }
    },
    addItem(xy) {
      const data = {
        room: this.room.id,
        zone: this.room.zone,
        data: { room_xy: xy, type: this.variant },
      }
      this.$store.item.save(data).then(this.$store.route.refetchItems)
    },
    removeItem(id) {
      this.$store.item.delete({ id }).then(this.$store.route.refetchItems)
      this.bounceSave()
    },
    deleteOverride(id) {
      const { data } = this.room
      data.cre_overrides = data.cre_overrides.filter((_, oid) => oid !== id)
      this.bounceSave()
    },
    deletePlm(xy) {
      const { data } = this.room
      delete data.plm_overrides[xy]
      this.bounceSave()
    },
    deleteLink(link) {
      const { data } = this.room
      delete data.links[link.xy]
      this.bounceSave()
    },
  },
}
</script>
