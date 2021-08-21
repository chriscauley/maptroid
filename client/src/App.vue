<template>
  <div>
    <div ref="overlay">
      <div v-for="item in items" v-bind="item" :key="item.id" />
    </div>
    <open-seadragon :pixelated="true" :options="options" :style="style" :events="events" />
  </div>
</template>

<script>
import OpenSeadragon from 'openseadragon'

export default {
  data() {
    return {
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
          const viewer = event.eventSource
          const { x, y } = viewer.world.getItemAt(0).getContentSize()
          const location = new OpenSeadragon.Rect(0, 0, 1, 1)
          viewer.addOverlay(this.$refs.overlay, location)
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
