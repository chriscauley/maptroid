<template>
  <div v-if="zoom" class="osd-zoom-controls" :style="wrapper_style">
    <div class="osd-zoom-controls__track" />
    <unrest-draggable
      class="osd-zoom-controls__current"
      :style="handle_style"
      @dragstart="dragstart"
      @drag="drag"
    />
  </div>
</template>

<script>
import Mousetrap from '@unrest/vue-mousetrap'
const clamp = (number, lower, upper) => Math.min(upper, Math.max(number, lower))

const levels = [0, 0.5, 1, 2, 3, 4]

export default {
  mixins: [Mousetrap.Mixin],
  props: {
    viewer: Object,
  },
  data() {
    return { zoom: null, start_zoom: undefined, box: undefined }
  },
  computed: {
    wrapper_style() {
      const { height, width } = this.viewer.navigator.element.getBoundingClientRect()
      return { right: `${width}px`, height: `${height}px` }
    },
    handle_style() {
      return { bottom: `${(100 * (this.zoom.current - this.zoom.min)) / this.zoom.range}%` }
    },
    mousetrap() {
      return {
        '+=': () => this.nextZoom(),
        '-': () => this.prevZoom(),
      }
    },
  },
  mounted() {
    this.viewer.addHandler('zoom', this.setZoom)
    this.viewer.addOnceHandler('open', this.setZoom)
  },
  methods: {
    setZoom() {
      this.zoom = {
        current: this.viewer.viewport.getZoom(),
        min: this.viewer.viewport.getMinZoom(),
        max: this.viewer.viewport.getMaxZoom(),
      }
      this.zoom.range = this.zoom.max - this.zoom.min
    },
    dragstart() {
      this.box = this.$el.getBoundingClientRect()
      this.start_zoom = this.viewer.viewport.getZoom()
    },
    drag(event) {
      const { xy_start, xy } = event._drag
      const delta_ratio = (xy_start[1] - xy[1]) / this.box.height
      this.applyZoom(this.start_zoom + delta_ratio * this.zoom.range)
    },
    applyZoom(value) {
      this.viewer.viewport.zoomTo(clamp(value, this.zoom.min, this.zoom.max))
    },
    nextZoom() {
      const index = levels.findIndex((v) => v > this.zoom.current)
      this.applyZoom(levels[index])
    },
    prevZoom() {
      const _levels = levels.slice().reverse()
      const index = _levels.findIndex((v) => v < this.zoom.current)
      this.applyZoom(_levels[index])
    },
  },
}
</script>
