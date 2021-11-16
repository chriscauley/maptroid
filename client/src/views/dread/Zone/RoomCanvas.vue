<template>
  <div :class="css" :style="wrapper_style">
    <unrest-draggable @dragend="dragend" @drag="drag">
      <canvas v-bind="canvasAttrs" ref="canvas" />
    </unrest-draggable>
    <router-link v-if="to_zone" :to="to_zone" class="room-canvas__to-zone" />
    <template v-if="tool.selected === 'room_bounds'">
      <unrest-draggable class="room-canvas__resize btn -mini -primary" @drag="resize">
        <i class="fa fa-arrows-alt" />
      </unrest-draggable>
      <div class="room-canvas__delete btn -mini -danger" @click="$emit('delete', room)">
        <i class="fa fa-trash" />
      </div>
      <unrest-draggable class="room-canvas__move btn -mini -primary" @drag="move">
        <i class="fa fa-arrows" />
      </unrest-draggable>
      <room-form :room="room" :zones="zones" />
    </template>
    <div
      v-for="item in items"
      v-bind="item.attrs"
      :key="item.id"
      @click="(e) => clickItem(e, item)"
    >
      <item-popper v-if="item.selected" :item="item._item" />
    </div>
    <div
      v-for="(style, i) in drawn_colors"
      :style="style"
      :key="i"
      @click="(e) => clickColor(e, i)"
    />
  </div>
</template>

<script>
import DreadItems from '@/models/DreadItems'
import ItemPopper from './ItemPopper'
import RoomForm from './RoomForm.vue'

const grids = {}

export default {
  components: { ItemPopper, RoomForm },
  inject: ['video'],
  props: {
    osd_store: Object,
    room: Object,
    tool_storage: Object,
    zone_items: Array,
    zones: Array,
  },
  emits: ['debug', 'delete', 'add-item', 'delete-item', 'select-item'],
  data() {
    return { drawing: null }
  },
  computed: {
    to_zone() {
      if (this.room.data.to_zone) {
        const zone = this.zones.find((z) => z.id === this.room.data.to_zone)
        const query = this.$auth.user?.is_superuser ? `?video=${this.$route.query.video}` : ''
        return zone && `/dread/${zone.slug}/${query}`
      }
      return undefined
    },
    css() {
      const selected_id = this.osd_store.state.selected_item?.id
      const has_selected = !!this.room_items.find((i) => i.id === selected_id)
      return ['room-canvas__wrapper', has_selected && '-selected-item', this.to_zone && '-to-zone']
    },
    tool() {
      const { selected_tool, selected_variant } = this.tool_storage.state
      return { selected: selected_tool, variant: selected_variant }
    },
    wrapper_style() {
      const { px_per_block } = this.osd_store.getGeometry()
      const size = Math.floor(px_per_block)
      if (!grids[size]) {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = size
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = 'black'
        ctx.rect(0, 0, 1, size)
        ctx.rect(0, 0, size, 1)
        ctx.fill()
        grids[size] = `url(${canvas.toDataURL()})`
      }
      const [x, y, width, height] = this.room.data.zone_bounds
      return {
        height: this.osd_store.scaleBlock(height),
        left: this.osd_store.scaleBlock(x),
        top: this.osd_store.scaleBlock(y),
        width: this.osd_store.scaleBlock(width),
        backgroundImage: grids[size],
        backgroundSize: `${100 / width}% auto`,
      }
    },
    drawn_colors() {
      if (this.$route.query.mode !== 'room') {
        return []
      }
      const colors = (this.room.data.colors || []).slice()
      if (this.drawing) {
        colors.push({ color: this.tool.variant, bounds: this.drawing, draft: true })
      }
      const [_x, _y, W, H] = this.room.data.zone_bounds
      return colors.map((color, _index) => {
        // if (!color.bounds) {
        //   // TODO occasionally data becomes corrupted and this deletes it
        //   this.clickColor({shiftKey: true }, _index)
        //   console.log('deleting', _index)
        //   return {}
        // }
        const [x, y, w, h] = color.bounds
        return {
          position: 'absolute',
          left: `${(100 * x) / W}%`,
          top: `${(100 * y) / H}%`,
          width: `${(100 * w) / W}%`,
          height: `${(100 * h) / H}%`,
          border: color.draft && '3px solid white',
          backgroundColor: DreadItems.colors[color.color],
        }
      })
    },
    canvasAttrs() {
      const { px_per_block } = this.osd_store.getGeometry()
      const [_x, _y, width, height] = this.room.data.zone_bounds
      return {
        width: width * px_per_block,
        height: height * px_per_block,
        class: 'room-canvas',
        id: `room-canvas__${this.room.id}`,
      }
    },
    room_items() {
      return this.zone_items.filter((i) => i.room === this.room.id)
    },
    items() {
      const [_x, _y, W, H] = this.room.data.zone_bounds
      return this.room_items.map((item) => {
        const { type, bounds } = item.data
        const [x, y, w, h] = bounds
        const selected = this.osd_store.state.selected_item?.id === item.id
        return {
          id: item.id,
          _item: item,
          name: DreadItems.getName(item),
          reward: item.data.reward,
          selected,
          attrs: {
            id: `zone-item__${item.id}`,
            class: [DreadItems.getClass(type), selected && '-selected'],
            style: {
              position: 'absolute',
              left: `${(100 * x) / W}%`,
              top: `${(100 * y) / H}%`,
              width: `${(100 * w) / W}%`,
              height: `${(100 * h) / H}%`,
            },
          },
        }
      })
    },
  },
  mounted() {
    this.draw()
  },
  methods: {
    getGrid(xy, half) {
      const box = this.$el.getBoundingClientRect()
      const px_per_block = box.width / this.room.data.zone_bounds[2]
      const pixels_x = xy[0] - box.x
      const pixels_y = xy[1] - box.y
      if (half) {
        return [
          Math.floor((2 * pixels_x) / px_per_block) / 2,
          Math.floor((2 * pixels_y) / px_per_block) / 2,
        ]
      }
      return [Math.floor(pixels_x / px_per_block), Math.floor(pixels_y / px_per_block)]
    },
    clickItem(event, item) {
      if (event.shiftKey || this.tool.selected === 'room_item_trash') {
        this.$emit('delete-item', item)
      } else {
        this.$emit('select-item', item)
      }
    },
    drag(event) {
      const is_trash = this.tool.variant === 'TRASH' || event.shiftKey
      if (this.tool.selected === 'room_colors' && !is_trash) {
        const [x1, y1] = this.getGrid(event._drag.xy_start, true)
        const [x2, y2] = this.getGrid(event._drag.xy, true)
        this.drawing = [
          Math.min(x1, x2),
          Math.min(y1, y2),
          Math.abs(x1 - x2) + 0.5,
          Math.abs(y1 - y2) + 0.5,
        ]
      }
    },
    dragend(event) {
      if (this.tool.selected === 'room_item') {
        const { xy, xy_start } = event._drag
        const [x0, y0] = this.getGrid(xy_start)
        const [x1, y1] = this.getGrid(xy)
        const bounds = [
          Math.min(x0, x1),
          Math.min(y0, y1),
          1 + Math.abs(x1 - x0),
          1 + Math.abs(y1 - y0),
        ]
        this.$emit('add-item', {
          room: this.room.id,
          data: { type: this.tool.variant, bounds },
        })
      } else if (this.tool.selected === 'room_colors' && this.tool.variant !== 'TRASH') {
        const colors = this.room.data.colors || []
        colors.push({
          color: this.tool.variant,
          bounds: this.drawing,
        })
        this.setColors(colors)
        this.drawing = null
      }
    },
    draw() {
      const { width, height } = this.$refs.canvas
      const ctx = this.$refs.canvas.getContext('2d')
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, width, height)
    },
    resize(event) {
      this._drag('resize', event)
    },
    move(event) {
      this._drag('move', event)
    },
    _drag(mode, event) {
      this.osd_store.dragRoom(mode, this.room, event._drag.last_dxy)
      this.$emit('debug', this.room.data.zone_bounds.map((i) => i.toFixed(1)).join(', '))
      this.$store.room2.bounceSave(this.room)
      // this.draw()
    },
    clickColor(event, index) {
      if (event.shiftKey || this.tool.variant === 'TRASH') {
        this.setColors(this.room.data.colors.filter((_, i) => i !== index))
      }
    },
    setColors(colors) {
      // TODO somehow when deleting colors, corrupted data can be added.
      colors = colors.filter((c) => c.bounds)
      this.room.data.colors = colors // eslint-disable-line vue/no-mutating-props
      this.$store.room2.save(this.room)
    },
  },
}
</script>
