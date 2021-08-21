<template>
  <div :id="id"></div>
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
    if (this.pixelated) {
      this.viewer.addHandler('zoom', () => {
        const tiledImage = this.viewer.world.getItemAt(0)
        const targetZoom =
          tiledImage.source.dimensions.x / this.viewer.viewport.getContainerSize().x
        this.viewer.drawer.context.imageSmoothingEnabled =
          this.viewer.viewport.getZoom() < targetZoom
      })
    }
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
