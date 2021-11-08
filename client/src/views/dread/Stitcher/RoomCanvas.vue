<template>
  <div class="room-canvas__wrapper" :style="wrapper_style">
    <unrest-draggable @dragend="dragend" @drag="drag">
      <canvas v-bind="canvasAttrs" ref="canvas" />
    </unrest-draggable>
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
    </template>
    <i v-for="item in items" v-bind="item.attrs" :key="item.id" @click="clickItem(item)" />
    <div v-for="(style, i) in drawn_colors" :style="style" :key="i" @click="clickColor(i)" />
  </div>
</template>

<script>
import DreadItems from '@/models/DreadItems'

const grids = {}

export default {
  props: {
    osd_store: Object,
    room: Object,
    tool_storage: Object,
    zone_items: Array,
  },
  emits: ['debug', 'delete', 'add-item', 'delete-item'],
  data() {
    return { drawing: null }
  },
  computed: {
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
        pointerEvents: this.tool.selected.startsWith('room') ? '' : 'none',
        backgroundImage: grids[size],
        backgroundSize: `${100 / width}% auto`,
      }
    },
    drawn_colors() {
      const colors = (this.room.data.colors || []).slice()
      if (this.drawing) {
        colors.push({ color: this.tool.variant, bounds: this.drawing, draft: true })
      }
      const [_x, _y, W, H] = this.room.data.zone_bounds
      return colors.map((color) => {
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
    items() {
      const [_x, _y, W, H] = this.room.data.zone_bounds
      return this.zone_items
        .filter((i) => i.room === this.room.id)
        .map((item) => {
          const { type, bounds } = item.data
          const [x, y, w, h] = bounds
          return {
            id: item.id,
            attrs: {
              id: `zone-item__${item.id}`,
              class: DreadItems.getClass(type),
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
    getGrid(xy) {
      const box = this.$el.getBoundingClientRect()
      const px_per_block = box.width / this.room.data.zone_bounds[2]
      const pixels_x = xy[0] - box.x
      const pixels_y = xy[1] - box.y
      return [Math.floor(pixels_x / px_per_block), Math.floor(pixels_y / px_per_block)]
    },
    clickItem(item) {
      if (this.tool.selected === 'room_item_trash') {
        this.$emit('delete-item', item)
      }
    },
    drag(event) {
      if (this.tool.selected === 'room_colors' && this.tool.variant !== 'TRASH') {
        const [x1, y1] = this.getGrid(event._drag.xy_start)
        const [x2, y2] = this.getGrid(event._drag.xy)
        this.drawing = [
          Math.min(x1, x2),
          Math.min(y1, y2),
          Math.abs(x1 - x2) + 1,
          Math.abs(y1 - y2) + 1,
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
    clickColor(index) {
      if (this.tool.variant === 'TRASH') {
        this.setColors(this.room.data.colors.filter((_, i) => i !== index))
      }
    },
    setColors(colors) {
      this.room.data.colors = colors // eslint-disable-line vue/no-mutating-props
      this.$store.room2.save(this.room)
    },
  },
}
</script>
