<template>
  <svg class="osd__svg">
    <g>
      <rect v-for="(rect, i) in rects" :key="i" v-bind="rect" />
      <!-- <path v-for="(path, i) in prepped_paths" :key="i" v-bind="path" /> -->
      <line v-for="(arrow, i) in _arrows" :key="i" v-bind="arrow" />
      <svg-defs />
    </g>
  </svg>
</template>

<script>
import SvgDefs from './SvgDefs.vue'
import './svg-overlay'

export default {
  components: { SvgDefs },
  props: {
    arrows: Array,
    viewer: Object,
    world: Object,
  },
  data() {
    return { W: 1, H: 1 }
  },
  computed: {
    rects() {
      return [
        // this._scale({ scale: 256, fill: 'green', x: 16, y: 0, width: 5, height: 5 })
      ]
    },
    _arrows() {
      return this.arrows.map((a) => {
        return this._scale({
          ...a,
          scale: 256,
          stroke: 'green',
          'stroke-width': 1 / 24,
        })
      })
    },
  },
  mounted() {
    this.viewer.svgOverlay(this.$el)
    const { x, y } = this.viewer.world.getItemAt(0).getContentSize()
    this.W = this.H = Math.max(x, y)
  },
  methods: {
    _scale({ scale = 1, ...attrs }) {
      const _scale = scale / this.W
      return Object.fromEntries(
        Object.entries(attrs).map(([k, v]) => {
          if (typeof v === 'number') {
            return [k, v * _scale]
          }
          if (k === 'd' && typeof v === 'string') {
            // TODO maybe cache this as string operations are expensive
            // scale path string like 'M 256 256' > 'M 1 1' (if this.W === 256)
            v = v.split(' ')
            v = v.map((s) => (s.match(/^-?[\d+\.]+$/) ? Number(s) * _scale : s))
            v = v.join(' ')
          }
          return [k, v]
        }),
      )
    },
  },
}
</script>
