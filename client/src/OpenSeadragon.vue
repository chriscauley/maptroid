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
    callback: Function,
  },

  data() {
    return { viewer: null }
  },

  mounted() {
    const { ...options } = this.options
    options.element = this.$el
    window.viewer_jawn = this.viewer = new OpenSeadragon(options)

    const { viewport } = this.viewer
    viewport.centerSpringY.animationTime = 0.25
    viewport.centerSpringX.animationTime = 0.25
    viewport.zoomSpring.animationTime = 0.25
    this.bindEvents()
    this.callback?.(this.viewer)
    if (this.pixelated) {
      const onZoom = () => {
        const { drawer, viewport } = this.viewer
        drawer.context.imageSmoothingEnabled = viewport.getZoom() < 0.5
      }
      this.viewer.addHandler('zoom', onZoom)
      this.viewer.addOnceHandler('tile-loaded', onZoom)
    }
  },

  methods: {
    bindEvents() {
      const { events = {}, viewer } = this
      Object.entries(events).forEach(([key, handler]) => viewer.addHandler(key, handler))
    },
  },
}
</script>
