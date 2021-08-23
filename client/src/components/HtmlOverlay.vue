<template>
  <div class="html-overlay">
    <div :style="`--border-width: ${border_width}px`">
      <div class="html-overlay__select" v-bind="select_attrs" />
      <div v-for="item in items" v-bind="item" :key="item.id">
        <selected-item v-if="item.selected" />
      </div>
      <div v-bind="ui_attributes" />
      <div v-if="drag_box" v-bind="drag_box" />
    </div>
  </div>
</template>

<script>
import OpenSeadragon from 'openseadragon'
import SelectedItem from './SelectedItem.vue'

const { Point, Rect } = OpenSeadragon

export default {
  components: { SelectedItem },
  props: {
    viewer: Object,
  },
  data() {
    const select_box = { x: 0, y: 0, w: 0, h: 0 }
    return { select_box, W: null, H: null, border_width: 2 }
  },
  computed: {
    drag_box() {
      const { selected_tool } = this.$store.viewer.state
      if (selected_tool !== 'boss') {
        return {}
      }
      const { x, y, width, height } = this.$store.viewer.drag_bounds
      return {
        style: this._scale({
          left: x,
          top: y,
          width,
          height,
        }),
        class: 'osd__drag-box',
      }
    },
    ui_attributes() {
      const { selected_tool, pointer } = this.$store.viewer.state
      if (selected_tool === 'item' && pointer) {
        const { x, y } = pointer
        return {
          style: this._scale({
            top: Math.floor(y) - 8,
            left: Math.floor(x) - 8,
            width: 16,
            height: 16,
          }),
          class: 'hover-box',
        }
      }
      return {}
    },
    items() {
      const items = this.$store.item.getAll()
      const selected_id = this.$store.viewer.state.selected_item
      return items.map(({ id, x, y, width, height, ...item }) => {
        return {
          id: `overlay-item-${id}`,
          selected: selected_id === id,
          onClick: () => this.$store.viewer.patch({ selected_item: id }),
          class: `item-box class-${item.class}`,
          style: {
            ...this._scale({
              left: x,
              top: y,
              width,
              height,
            }),
          },
        }
      })
    },
    select_attrs() {
      return {}
    },
  },
  mounted() {
    const location = new Rect(0, 0, 1, 1)
    this.viewer.addOverlay(this.$el, location)
    const { x, y } = this.viewer.world.getItemAt(0).getContentSize()
    this.W = this.H = Math.max(x, y)
    this.viewer.addHandler('animation-finish', () => {
      this.border_width = this.viewer.viewport.imageToViewportCoordinates(new Point(2, 2)).x
    })
  },
  methods: {
    _scale(attrs) {
      return Object.fromEntries(
        Object.entries(attrs).map(([k, v]) => [k, `${(100 * v) / this.W}%`]),
      )
    },
  },
}
</script>
