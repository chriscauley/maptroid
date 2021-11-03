<template>
  <div class="osd-html__overlay">
    <slot />
  </div>
</template>

<script>
import OpenSeadragon from 'openseadragon'

export default {
  props: {
    viewer: Object,
  },
  mounted() {
    this.viewer.addOverlay(this.$el, new OpenSeadragon.Rect(0, 0, 1, 1))
  },
}
</script>
