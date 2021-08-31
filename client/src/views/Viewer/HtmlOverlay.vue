<template>
  <div class="osd-html__overlay">
    <template v-for="(blocks, i) in block_groups" :key="i">
      <div v-for="block in blocks" v-bind="block.attrs" :key="block.attrs.id" />
    </template>
    <div v-bind="ui_box" />
  </div>
</template>

<script>
import OpenSeadragon from 'openseadragon'
import Item from '@/models/Item'

export default {
  props: {
    items: Array,
    screens: Array,
    viewer: Object,
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
      const { x, y, width, height } = this.$store.viewer.getPointer(this.world.map_item_size)
      return {
        style: this._scale({ x, y, width, height }),
        class: 'osd__drag-box',
      }
    },
    item_blocks() {
      return this.items?.map((item) => {
        const { id, type, class: _class } = item
        const { x, y, width, height } = Item.getMapBounds(item, this.world)
        return {
          item,
          attrs: {
            id: `overlay-item-${id}`,
            class: `html-overlay__item -class-${_class} sm-${_class} -${type}`,
            style: this._scale({ x, y, width, height }),
            onClick: () => this.$emit('click-item', item),
          },
        }
      })
    },
    screen_blocks() {
      return this.screens.map(({ x, y, width = 1, height = 1, ...item }) => {
        // there's a slight issue with cracks showing between elements
        // add 0.5% to width/height to stop it
        width *= 1.005
        height *= 1.005
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
      return [this.screen_blocks, this.item_blocks]
    },
  },
  mounted() {
    // TODO this should probably go in store.viewer
    this.viewer.addOverlay(this.$el, new OpenSeadragon.Rect(0, 0, 1, 1))
    const { x, y } = this.viewer.world.getItemAt(0).getContentSize()
    this.SIZE = Math.max(x, y)
    // this.viewer.addHandler('animation-finish', () => {
    //   this.border_width = this.viewer.viewport.imageToViewportCoordinates(new Point(2, 2)).x
    // })
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
