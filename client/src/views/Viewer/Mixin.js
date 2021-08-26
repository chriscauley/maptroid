export default {
  data() {
    return {
      viewer: null,
      overzoomed: false,
      events: {
        open: (event) => {
          this.viewer = event.eventSource
        },
        zoom: (event) => {
          const { world, viewport, drawer } = event.eventSource
          const tiledImage = world.getItemAt(0)
          const targetZoom = tiledImage.source.dimensions.x / viewport.getContainerSize().x
          this.overzoomed = viewport.getZoom() > targetZoom
          drawer.context.imageSmoothingEnabled = !this.overzoomed
        },
      },
      options: {
        tileSources: ['/output/SuperMetroidMapZebes.dzi'],
        // tileSources: { type: 'image', url: 'SuperMetroidMapZebes.png' },
        maxZoomPixelRatio: 8,
        showNavigator: true,
        showZoomControl: false,
        showHomeControl: false,
        showFullPageControl: false,
        showRotationControl: false,
        debugmode: false,
        clickTimeThreshold: 1000,
        gestureSettingsMouse: {
          clickToZoom: false,
          dblClickToZoom: false,
        },
      },
    }
  },
  computed: {
    viewer_class() {
      return ['viewer-wrapper', { '-overzoomed': this.overzoomed }]
    },
  },
}
