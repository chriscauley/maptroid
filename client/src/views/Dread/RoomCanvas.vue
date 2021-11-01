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
        height: this.$store.osd.scaleBlock(height),
        left: this.$store.osd.scaleBlock(x),
        top: this.$store.osd.scaleBlock(y),
        width: this.$store.osd.scaleBlock(width),
        pointerEvents: this.mode ? '' : 'none',
      }
    },
    canvasAttrs() {
      const scale = this.$store.osd.PX_PER_BLOCK
      const [_x, _y, width, height] = this.room.data.zone_bounds
      return {
        width: width * scale,
        height: height * scale,
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
      const scale = this.$store.osd.PX_PER_BLOCK
      const { width, height } = this.$refs.canvas
      const ctx = this.$refs.canvas.getContext('2d')
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, width, height)

      ctx.beginPath()
      for (let i = 0; i * scale <= height; i++) {
        ctx.moveTo(0, scale * i)
        ctx.lineTo(width, scale * i)
      }
      for (let i = 0; i * scale <= width; i++) {
        ctx.moveTo(scale * i, 0)
        ctx.lineTo(scale * i, height)
      }
      ctx.stroke()
    },
    drag({ last_dxy }) {
      this.$store.osd.dragRoom(this.mode, this.room, last_dxy)
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
