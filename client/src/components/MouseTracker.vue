<template>
  <div :style="style" />
</template>

<script>
import OpenSeadragon from 'openseadragon'

const { MouseTracker, Point } = OpenSeadragon

export default {
  props: {
    viewer: Object,
  },
  data() {
    return { drag_start: null }
  },
  computed: {
    style() {
      const { selected_tool } = this.$store.viewer.state
      const tools = ['item']
      return {
        position: 'absolute',
        inset: 0,
        display: tools.includes(selected_tool) ? 'block' : 'none',
      }
    },
  },
  mounted() {
    this.$el.parentNode.removeChild(this.$el)
    this.viewer.addOverlay(this.$el, undefined, undefined, () => {})
    this.mouseTracker = new MouseTracker({
      element: this.$el,
      pressHandler: this.press,
      dragHandler: this.drag,
      dragEndHandler: this.dragEnd,
      moveHandler: this.move,
    })
  },
  methods: {
    eventToImagePoint(e) {
      const { x, y } = e.originalEvent
      const p = new Point(x + window.scrollX, y + window.scrollY)
      return this.viewer.world.getItemAt(0).windowToImageCoordinates(p)
    },
    press(e) {
      const { selected_tool, pointer } = this.$store.viewer.state
      window.$store = this.$store
      if (selected_tool === 'item') {
        const { x, y } = pointer
        this.$store.item
          .save({
            type: 'item',
            x: Math.floor(x - 8),
            y: Math.floor(y - 8),
            width: 16,
            height: 16,
          })
          .then(({ id }) => {
            this.$store.viewer.patch({ editing: id })
            this.$store.item.getItems()
          })
      } else {
        this.$store.viewer.patch({ drag_start: this.eventToImagePoint(e) })
      }
    },
    drag(e) {
      this.$store.viewer.patch({ drag_end: this.eventToImagePoint(e) })
    },
    dragEnd() {},
    move(e) {
      this.$store.viewer.patch({ pointer: this.eventToImagePoint(e) })
    },
  },
}
</script>
