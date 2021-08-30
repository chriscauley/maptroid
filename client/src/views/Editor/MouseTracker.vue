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
      const tools = ['item', 'boss', 'door', 'chozo', 'map', 'room']
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
      const { selected_tool, pointer, item_tool } = this.$store.viewer.state
      if (selected_tool === 'item') {
        const { x, y } = pointer
        const data = {
          class: 'item',
          world_xy: [Math.floor(x / 256), Math.floor(y / 256)],
          screen_xy: [Math.floor((x % 256) / 16), Math.floor((y % 256) / 16)],
          width: 1,
          height: 1,
          type: item_tool,
        }
        this.$store.item.save(data).then(() => this.$store.item.getAll())
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
      const { x, y, width, height } = this.$store.viewer.pointer
      if (width && height && ['boss', 'door', 'map', 'chozo'].includes(selected_tool)) {
        const type = this.$store.viewer.state[selected_tool + '_tool']
        const data = {
          class: selected_tool,
          type,
          x,
          y,
          width,
          height,
        }
        this.$store.item.save(data).then(() => this.$store.item.getAll())
      }
      this.$store.viewer.patch({ drag_start: null, drag_end: null })
    },
    move(e) {
      this.$store.viewer.patch({ pointer: this.eventToImagePoint(e) })
    },
  },
}
</script>
