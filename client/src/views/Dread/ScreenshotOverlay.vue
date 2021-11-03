<template>
  <unrest-draggable
    :class="css"
    :style="style"
    @drag="drag"
    @dragstart="dragstart"
    @dragend="dragend"
  >
    <img :src="screenshot.output" />
  </unrest-draggable>
</template>

<script>
export default {
  props: {
    screenshot: Object,
    storage: Object,
  },
  data() {
    return { dragging: false }
  },
  computed: {
    css() {
      const { group } = this.screenshot.data.zone
      return [`dread-anchor -group-${group}`, { '-dragging': this.dragging }]
    },
    style() {
      const { xy, width } = this.screenshot.data.zone
      const height = 430 / 1280
      return {
        width: `${100 * width}%`,
        height: `${100 * height}%`,
        top: `${100 * xy[1]}%`,
        left: `${100 * xy[0]}%`,
      }
    },
  },
  methods: {
    dragstart() {
      const { selected_tool } = this.storage.state
      if (selected_tool === 'group') {
        return
      }
      this.$store.osd.setAllOpacity(1)
      this.$store.osd.setOpacity(this.screenshot, 0)
      this.dragging = true
    },

    drag(state, event) {
      const { selected_tool } = this.storage.state
      if (selected_tool === 'group') {
        return
      }
      const [x, y] = state.last_dxy
      if (x || y) {
        const { group } = this.screenshot.data.zone
        const move_group = group && !event.shiftKey
        this.$store.osd.moveScreenshot(this.screenshot, { x, y }, move_group)
      }
    },

    dragend() {
      this.dragging = false
      this.$store.osd.setAllOpacity(1)

      // if the screenshot was not moved and the group tool is selected, toggle the group
      const { selected_tool, selected_variant } = this.storage.state
      if (selected_tool === 'group') {
        if (!selected_variant || this.screenshot.data.zone.group === selected_variant) {
          this.$store.osd.setGroup(this.screenshot, null)
        } else {
          this.$store.osd.setGroup(this.screenshot, selected_variant)
        }
      }

      if (selected_tool === 'trash') {
        this.$store.screenshot.delete(this.screenshot)
      }
    },
  },
}
</script>
