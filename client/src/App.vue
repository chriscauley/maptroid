<template>
  <div>
    <div ref="overlay">
      <div v-for="item in items" v-bind="item" :key="item.id" />
    </div>
    <open-seadragon :pixelated="true" :options="options" :style="style" :events="events" />
    <html-overlay v-if="viewer" :viewer="viewer" />
  </div>
</template>

<script>
import HtmlOverlay from '@/components/HtmlOverlay.vue'

export default {
  components: { HtmlOverlay },
  data() {
    return {
      viewer: null,
      items: [
        {
          id: 'overlay-0',
          style: 'width: 1%; height: 1%; position: absolute; top: 1%; background: white',
        },
      ],
      style: 'width: 100vw;height: 100vh;',
      events: {
        'canvas-click': (event) => {
          if (event.quick) {
            const viewer = event.eventSource
            const webPoint = event.position
            const viewportPoint = viewer.viewport.pointFromPixel(webPoint)
            const imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint)
            console.log(':)', webPoint.toString(), viewportPoint.toString(), imagePoint.toString())
          }
        },
        open: (event) => {
          this.viewer = event.eventSource
        },
      },
      options: {
        tileSources: ['output/SuperMetroidMapZebes.dzi'],
        // tileSources: { type: 'image', url: 'SuperMetroidMapZebes.png' },
        maxZoomPixelRatio: 4,
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
}
</script>
