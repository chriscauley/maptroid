<template>
  <canvas v-bind="canvasAttrs" @mousemove="mousemove" />
</template>

<script>
// TODO prop? config variable? All this does is set a ratio between lineWidth and block size
const scale = 16

export default {
  props: {
    room: Object,
  },
  computed: {
    canvasAttrs() {
      const [_x, _y, width, height] = this.room.data.zone_bounds
      return {
        width: width * scale,
        height: height * scale,
        class: 'room-canvas',
        id: `room-canvas__${this.room.id}`,
        style: {
          width: this.$store.osd.scaleBlock(width),
          height: this.$store.osd.scaleBlock(height),
          background: 'white',
          position: 'absolute',
          imageRendering: 'pixelated',
          zIndex: 10,
        },
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
      const { width, height } = this.$el
      const ctx = this.$el.getContext('2d')
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, width, height)
      // this.room.data.shapes?.forEach((entities) => {})
      ctx.fillStyle = 'black'
      ctx.rect(0, 0, scale, scale)
      ctx.fill()
    },
  },
}
</script>
