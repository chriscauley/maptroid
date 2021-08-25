<template>
  <div v-show="show" class="osd__mouse-tracker" />
</template>

<script>
import OpenSeadragon from 'openseadragon'
import Mousetrap from '@unrest/vue-mousetrap'

const { MouseTracker, Point } = OpenSeadragon

export default {
  mixins: [Mousetrap.Mixin],
  props: {
    viewer: Object,
  },
  data() {
    return { drag_start: null }
  },
  computed: {
    mousetrap() {
      return {
        esc: () => this.$store.viewer.patch({ drag_start: null, drag_end: null }),
      }
    },
    show() {
      const { selected_tool } = this.$store.viewer.state
      const tools = ['item', 'boss', 'room']
      return tools.includes(selected_tool)
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
      if (selected_tool === 'item') {
        const { x, y } = pointer
        this.$store.item
          .save({
            class: item,
            x: Math.floor(x - 8),
            y: Math.floor(y - 8),
            width: 16,
            height: 16,
          })
          .then(() => this.$store.item.getAll())
      } else if (selected_tool === 'room') {
        this.$store.viewer.clickRoom()
      } else {
        const p = this.eventToImagePoint(e)
        this.$store.viewer.patch({ drag_start: p, drag_end: p })
      }
    },
    drag(e) {
      this.$store.viewer.patch({ drag_end: this.eventToImagePoint(e) })
    },
    dragEnd() {
      const { selected_tool } = this.$store.viewer.state
      const { x, y, width, height } = this.$store.viewer.drag_bounds
      if (width && height && ['boss'].includes(selected_tool)) {
        this.$store.item
          .save({
            x,
            y,
            width,
            height,
            class: selected_tool,
          })
          .then(() => {
            this.$store.item.getAll()
          })
      }
      this.$store.viewer.patch({ drag_start: null, drag_end: null })
    },
    move(e) {
      this.$store.viewer.patch({ pointer: this.eventToImagePoint(e) })
    },
  },
}
</script>
