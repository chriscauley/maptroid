<template>
  <div class="flex-grow">
    <div class="viewer-wrapper">
      <open-seadragon :pixelated="true" :options="options" :events="events" />
      <template v-if="viewer">
        <html-overlay :viewer="viewer" />
        <mouse-tracker :viewer="viewer" />
        <toolbar />
      </template>
      <item-panel :viewer="viewer" />
    </div>
    <unrest-ui />
  </div>
</template>

<script>
import HtmlOverlay from '@/components/HtmlOverlay.vue'
import ItemPanel from '@/components/ItemPanel.vue'
import MouseTracker from '@/components/MouseTracker.vue'
import Toolbar from '@/components/Toolbar.vue'

export default {
  __route: {
    path: '/',
  },
  components: { HtmlOverlay, ItemPanel, MouseTracker, Toolbar },
  data() {
    return {
      viewer: null,
      events: {
        open: (event) => {
          this.viewer = event.eventSource
        },
      },
      options: {
        tileSources: ['output/SuperMetroidMapZebes.dzi'],
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
}
</script>
