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
    tool_storage: Object,
    osd_store: Object,
    zone: Object,
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
      const { xy } = this.screenshot.data.zone
      const { width, height } = this.zone.data.screenshot
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
      const { selected_tool } = this.tool_storage.state
      if (selected_tool === 'group') {
        return
      }
      this.osd_store.setAllOpacity(1)
      this.osd_store.setOpacity(this.screenshot, 0)
      this.dragging = true
    },

    drag(state, event) {
      const { selected_tool } = this.tool_storage.state
      if (selected_tool === 'group') {
        return
      }
      const [x, y] = state.last_dxy
      if (x || y) {
        const { group } = this.screenshot.data.zone
        const move_group = group && !event.shiftKey
        this.osd_store.moveScreenshot(this.screenshot, { x, y }, move_group)
      }
    },

    dragend() {
      this.dragging = false
      this.osd_store.setAllOpacity(1)

      // if the screenshot was not moved and the group tool is selected, toggle the group
      const { selected_tool, selected_variant } = this.tool_storage.state
      if (selected_tool === 'group') {
        if (!selected_variant || this.screenshot.data.zone.group === selected_variant) {
          this.osd_store.setGroup(this.screenshot, null)
        } else {
          this.osd_store.setGroup(this.screenshot, selected_variant)
        }
      }

      if (selected_tool === 'trash') {
        this.$store.screenshot.delete(this.screenshot)
      }
    },
  },
}
</script>
