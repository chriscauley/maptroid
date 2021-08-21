<template>
  <div class="html-overlay">
    <div :style="`--border-width: ${border_width}px`">
      <div class="html-overlay__select" v-bind="select_attrs" />
      <div v-for="item in items" v-bind="item" :key="item.id" />
    </div>
  </div>
</template>

<script>
import OpenSeadragon from 'openseadragon'

export default {
  props: {
    viewer: Object,
  },
  data() {
    const select_box = { x: 0, y: 0, w: 0, h: 0 }
    return { select_box, W: null, H: null, border_width: 2 }
  },
  computed: {
    items() {
      const items = [{ x: 100, y: 100, w: 100, h: 100 }]
      const _percent = (v) => `${(100 * v) / this.W}%`
      return items.map(({ id, x, y, w, h }) => {
        return {
          id,
          style: {
            left: _percent(x),
            top: _percent(y),
            width: _percent(w),
            height: _percent(h),
            border: 'var(--border-width) solid pink',
            position: 'absolute',
          },
        }
      })
    },
    select_attrs() {
      return {}
    },
  },
  mounted() {
    const location = new OpenSeadragon.Rect(0, 0, 1, 1)
    this.viewer.addOverlay(this.$el, location)
    const { x, y } = this.viewer.world.getItemAt(0).getContentSize()
    this.W = this.H = Math.max(x, y)
    this.viewer.addHandler('animation-finish', () => {
      this.border_width = this.viewer.viewport.imageToViewportCoordinates(
        new OpenSeadragon.Point(2, 2),
      ).x
    })
  },
}
</script>
