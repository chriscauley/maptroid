<template>
  <div @drag="drag" class="room-canvas__wrapper" :style="wrapper_style">
    <canvas v-bind="canvasAttrs" @mousemove="mousemove" ref="canvas" />
    <unrest-draggable v-if="action_icon" class="room-canvas__resize" @drag="drag">
      <div class="btn -mini -primary">
        <i :class="action_icon" />
      </div>
    </unrest-draggable>
  </div>
</template>

<script>
import { debounce } from 'lodash'

export default {
  props: {
    osd_store: Object,
    room: Object,
    mode: String,
  },
  emits: ['debug'],
  computed: {
    action_icon() {
      return {
        resize: 'fa fa-arrows-alt',
        move: 'fa fa-arrows',
      }[this.mode]
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
      const { px_per_block } = this.osd_store.getGeometry()
      const { width, height } = this.$refs.canvas
      const ctx = this.$refs.canvas.getContext('2d')
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, width, height)

      ctx.beginPath()
      for (let i = 0; i * px_per_block <= height; i++) {
        ctx.moveTo(0, px_per_block * i)
        ctx.lineTo(width, px_per_block * i)
      }
      for (let i = 0; i * px_per_block <= width; i++) {
        ctx.moveTo(px_per_block * i, 0)
        ctx.lineTo(px_per_block * i, height)
      }
      ctx.stroke()
    },
    drag({ last_dxy }) {
      this.osd_store.dragRoom(this.mode, this.room, last_dxy)
      this.$emit('debug', this.room.data.zone_bounds.map((i) => i.toFixed(1)).join(', '))
      this.save()
    },
    save: debounce(function() {
      this.$store.room2.save(this.room)
      this.draw()
    }, 1000),
  },
}
</script>
