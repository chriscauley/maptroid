<template>
  <div style="width: 100%; height: 100%;">
    <canvas @mousewheel.prevent="mousewheel" @mousemove="mousemove" ref="canvas" />
    <div class="__debug" v-if="state.mouse">
      <div class="w-48">offsetXY: {{ round([state.offsetX, state.offsetY]) }}</div>
      <div class="w-48">mouse: {{ round([state.mouse.x, state.mouse.y]) }}</div>
      <div class="w-48">scale: {{ state.scale.toFixed(2) }}</div>
    </div>
  </div>
</template>

<script>
import { debounce } from 'lodash'
import ScaleMixin from './ScaleMixin'

import Mousetrap from '@unrest/vue-mousetrap'

export default {
  mixins: [ScaleMixin, Mousetrap.Mixin],
  props: {
    sources: Array,
  },
  data() {
    return { frame: null, x: 1, y: 1, zoom_px: 1 }
  },
  computed: {
    mousetrap() {
      return {
        '=,+': this.scaleUp,
        '-': this.scaleDown,
      }
    },
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
    round(xy) {
      return [Math.floor(xy[0]), Math.floor(xy[1])]
    },
    _resize() {
      const { width, height } = this.$el.parentElement.getBoundingClientRect()
      Object.assign(this.$refs.canvas, { width, height })
      this.ctx = this.$refs.canvas.getContext('2d')
      this.ctx.imageSmoothingEnabled = false
    },
    redraw() {
      cancelAnimationFrame(this.frame)
      this.frame = requestAnimationFrame(this.redraw)
      const { width, height } = this.$refs.canvas
      this.ctx.clearRect(0, 0, width, height)
      this.ctx.save()
      const { offsetX, offsetY, scale } = this.state
      this.ctx.translate(scale * offsetX, scale * offsetY)
      this.ctx.scale(scale, scale)
      try {
        this.sources?.forEach((s) => s.draw(this.ctx, this.state))
        this.ctx.fillStyle = 'white'
        const { mouse, grid_size } = this.state
        this.ctx.fillRect(mouse.grid_x, mouse.grid_y, grid_size, grid_size)
      } catch (e) {
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
