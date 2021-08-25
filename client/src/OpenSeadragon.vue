<template>
  <div :id="id" class="osd-wrapper" />
</template>

<script>
import OpenSeadragon from 'openseadragon'

export default {
  props: {
    id: {
      type: String,
      default: 'openseadradon-viewer',
    },
    options: Object,
    events: Object,
    pixelated: Boolean,
  },

  data() {
    return { viewer: null }
  },

  mounted() {
    const { ...options } = this.options
    options.id = this.id
    window.jawn = this.viewer = new OpenSeadragon(options)

    const viewport = this.viewer.viewport
    viewport.centerSpringY.animationTime = 0.25
    viewport.centerSpringX.animationTime = 0.25
    viewport.zoomSpring.animationTime = 0.25
    this.bindEvents()
  },

  methods: {
    bindEvents() {
      const { events = {}, viewer } = this
      Object.entries(events).forEach(([key, handler]) => viewer.addHandler(key, handler))
    },
  },
}
</script>
