<template>
  <unrest-draggable
    class="dread-anchor"
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
  },
  data() {
    return { dragging: false }
  },
  computed: {
    style() {
      const { x, y, width } = this.screenshot.data._world
      const height = 430 / 1280
      return {
        width: `${100 * width}%`,
        height: `${100 * height}%`,
        top: `${100 * y}%`,
        left: `${100 * x}%`,
      }
    },
  },
  methods: {
    drag(state) {
      const [x, y] = state.last_dxy
      this.dragging = true
      if (x || y) {
        this.$store.osd.moveImage(this.screenshot, { x, y })
      }
    },
    dragstart() {
      this.$store.osd.setAllOpacity(1)
      this.$store.osd.setOpacity(this.screenshot, 0)
    },
    dragend() {
      this.dragging = false
      this.$store.osd.setAllOpacity(1)
    },
  },
}
</script>
