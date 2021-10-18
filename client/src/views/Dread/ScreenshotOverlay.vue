<template>
  <unrest-draggable class="dread-anchor" :style="style" @drag="drag" osd-off="true" />
</template>

<script>
export default {
  props: {
    screenshot: Object,
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
      if (x || y) {
        this.$store.osd.moveImage(this.screenshot, { x, y })
      }
    },
  },
}
</script>
