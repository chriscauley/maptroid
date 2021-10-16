<template>
  <canvas @mousewheel="mousewheel" @mousemove="mousemove" />
</template>

<script>
import { debounce } from 'lodash'
import ScaleMixin from './ScaleMixin'

export default {
  mixins: [ScaleMixin],
  props: {
    sources: Array,
  },
  data() {
    return { frame: null, x: 1, y: 1, zoom_px: 1 }
  },
  mounted() {
    this._resize()
    this.resize = debounce(this._resize, 200)
    this.redraw()
    window.addEventListener('resize', this.resize)
  },
  unmounted() {
    window.removeEventListener('resize', this.resize)
  },
  methods: {
    _resize() {
      const { width, height } = this.$el.parentElement.getBoundingClientRect()
      Object.assign(this.$el, { width, height })
      this.ctx = this.$el.getContext('2d')
      this.ctx.imageSmoothingEnabled = false
    },
    redraw() {
      cancelAnimationFrame(this.frame)
      this.frame = requestAnimationFrame(this.redraw)
      const { width, height } = this.$el
      this.ctx.clearRect(0, 0, width, height)
      this.ctx.save()
      const { offsetX, offsetY, scale } = this.boxy
      this.ctx.translate(scale * offsetX, scale * offsetY)
      this.ctx.scale(scale, scale)
      try {
        this.sources?.forEach((s) => s.draw(this.ctx, this.boxy))
      } catch(e) {
        // chrome freaks out if you throw 60 errors per second
        cancelAnimationFrame(this.frame)
        throw e
      }
      this.ctx.restore()
    },
    onMousewheel() {},
  },
}
</script>
