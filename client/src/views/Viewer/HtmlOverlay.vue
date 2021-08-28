<template>
  <div class="osd-html__overlay">
    <template v-for="(blocks, i) in block_groups" :key="i">
      <div v-for="block in blocks" v-bind="block" :key="block.id" />
    </template>
  </div>
</template>

<script>
import OpenSeadragon from 'openseadragon'

export default {
  props: {
    items: Array,
    screens: Array,
    viewer: Object,
    world: Object,
  },
  data() {
    return { W: 1, H: 1 }
  },
  computed: {
    item_blocks() {
      return this.items?.map((item) => {
        const { id, type, class: _class } = item
        const { x, y, width, height } = item.getMapBounds()
        return {
          id: `overlay-item-${id}`,
          class: `html-overlay__item -class-${_class} sm-${_class} -${type}`,
          style: this._scale({
            left: x,
            top: y,
            width,
            height,
          }),
        }
      })
    },
    screen_blocks() {
      return this.screens.map(({ x, y, width = 1, height = 1, cls }) => ({
        class: `html-overlay__screen-mask ${cls}`,
        style: this._scale({ left: x, top: y, width, height }, 256),
      }))
    },
    block_groups() {
      return [this.item_blocks, this.screen_blocks]
    },
  },
  mounted() {
    this.viewer.addOverlay(this.$el, new OpenSeadragon.Rect(0, 0, 1, 1))
    const { x, y } = this.viewer.world.getItemAt(0).getContentSize()
    this.W = this.H = Math.max(x, y)
    // this.viewer.addHandler('animation-finish', () => {
    //   this.border_width = this.viewer.viewport.imageToViewportCoordinates(new Point(2, 2)).x
    // })
  },
  methods: {
    _scale(attrs, scale = 1) {
      return Object.fromEntries(
        Object.entries(attrs).map(([k, v]) => [k, `${(100 * v * scale) / this.W}%`]),
      )
    },
  },
}
</script>
