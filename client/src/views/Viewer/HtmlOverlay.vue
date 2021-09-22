<template>
  <div class="osd-html__overlay">
    <template v-for="(blocks, i) in block_groups" :key="i">
      <div v-for="block in blocks" v-bind="block.attrs" :key="block.attrs.id" />
    </template>
    <slot />
    <div v-bind="ui_box" />
  </div>
</template>

<script>
import OpenSeadragon from 'openseadragon'

export default {
  props: {
    items: Array,
    screens: Array,
    world: Object,
  },
  emits: ['click-item'],
  data() {
    return {
      SIZE: 1, // Math.max(image.width, image.height) in pixels
    }
  },
  computed: {
    ui_box() {
      const { map_item_size, map_screen_size } = this.world
      const { selected_tool } = this.$store.viewer.state
      const scale = selected_tool === 'room' ? map_screen_size : map_item_size
      const { x, y, width, height } = this.$store.viewer.getPointer(scale)
      return {
        style: this._scale({ x, y, width, height }),
        class: 'osd__drag-box',
      }
    },
    screen_blocks() {
      return this.screens.map(({ x, y, width = 1, height = 1, ...item }) => {
        // there's a slight issue with cracks showing between elements
        // add 0.1% to width/height to stop it
        width *= 1.001
        height *= 1.001
        return {
          item,
          attrs: {
            class: ['html-overlay__screen-mask', item.class],
            style: this._scale({ x, y, width, height }, this.world.map_screen_size),
            onClick: item.onClick,
          },
        }
      })
    },
    block_groups() {
      return [this.screen_blocks]
    },
  },
  mounted() {
    // TODO this should probably go in store.viewer
    this.$store.osd_viewer.addOverlay(this.$el, new OpenSeadragon.Rect(0, 0, 1, 1))
    const { x } = this.$store.osd_viewer.world.getItemAt(0).getContentSize()
    this.$store.viewer.patch({ size: x })

    // TODO this is already in store.viewer B)
    this.SIZE = x
  },
  methods: {
    _scale(attrs, scale = 1) {
      return Object.fromEntries(
        Object.entries(attrs).map(([k, v]) => {
          if (k === 'x') {
            k = 'left'
          }
          if (k === 'y') {
            k = 'top'
          }
          return [k, `${(100 * v * scale) / this.SIZE}%`]
        }),
      )
    },
  },
}
</script>
