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
    world: Object,
    game: Object,
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
    refetchItems() {
      return this.$store.item.getAll({ world_id: this.world.id })
    },
    press(e) {
      const { selected_tool, item_tool } = this.$store.viewer.state
      if (selected_tool === 'item') {
        const { x, y } = this.$store.viewer.getPointer(this.world.map_item_size)
        const data = this.makeItem({ x, y, class: 'item', type: item_tool })
        this.$store.item.save(data).then(this.refetchItems)
      } else if (selected_tool === 'room') {
        this.$store.viewer.clickRoom(this.world.map_screen_size, this.game)
      } else {
        const p = this.eventToImagePoint(e)
        this.$store.viewer.patch({ drag_start: p, drag_end: p })
      }
    },
    drag(e) {
      this.$store.viewer.patch({ drag_end: this.eventToImagePoint(e) })
    },
    dragEnd() {
      const { map_item_size } = this.world
      const { selected_tool } = this.$store.viewer.state
      const { x, y, width, height } = this.$store.viewer.getPointer(map_item_size)
      if (width && height && ['boss', 'door', 'map', 'chozo'].includes(selected_tool)) {
        const type = this.$store.viewer.state[selected_tool + '_tool']
        const data = this.makeItem({ x, y, height, width, type, class: selected_tool })
        this.$store.item.save(data).then(this.refetchItems)
      }
      this.$store.viewer.patch({ drag_start: null, drag_end: null })
    },
    move(e) {
      this.$store.viewer.patch({ pointer: this.eventToImagePoint(e) })
    },
    makeItem({ x, y, width, height, ...item }) {
      const screen_size = this.world.map_screen_size
      const item_size = this.world.map_item_size
      return {
        world_xy: [Math.floor(x / screen_size), Math.floor(y / screen_size)],
        screen_xy: [
          Math.floor((x % screen_size) / item_size),
          Math.floor((y % screen_size) / item_size),
        ],
        world_id: this.world.id,
        width: (width || item_size) / item_size,
        height: (height || item_size) / item_size,
        ...item,
      }
    },
  },
}
</script>
