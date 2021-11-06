<template>
  <div class="room-canvas__wrapper" :style="wrapper_style">
    <canvas v-bind="canvasAttrs" @mousemove="mousemove" ref="canvas" />
    <div class="room-canvas__grid" :style="grid_style" />
    <template v-if="mode">
      <unrest-draggable class="room-canvas__resize btn -mini -primary" @drag="resize">
        <i class="fa fa-arrows-alt" />
      </unrest-draggable>
      <unrest-draggable class="room-canvas__move btn -mini -primary" @drag="move">
        <i class="fa fa-arrows" />
      </unrest-draggable>
    </template>
  </div>
</template>

<script>
const grids = {}

export default {
  props: {
    osd_store: Object,
    room: Object,
    mode: String,
  },
  emits: ['debug'],
  computed: {
    grid_style() {
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
      const width = this.room.data.zone_bounds[2]
      return {
        backgroundImage: grids[size],
        backgroundSize: `${100 / width}% auto`,
      }
    },
    wrapper_style() {
      const [x, y, width, height] = this.room.data.zone_bounds
      return {
        height: this.osd_store.scaleBlock(height),
        left: this.osd_store.scaleBlock(x),
        top: this.osd_store.scaleBlock(y),
        width: this.osd_store.scaleBlock(width),
        pointerEvents: this.mode ? '' : 'none',
      }
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
  },
  mounted() {
    this.draw()
  },
  methods: {
    mousemove() {
      // const box = this.$el.getBoundingClientRect()
      // const px_per_block = box.width / this.room.data.zone_bounds[2]
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
  },
}
</script>
