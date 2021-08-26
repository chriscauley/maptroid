<template>
  <div class="flex-grow">
    <div :class="css.wrapper">
      <open-seadragon :pixelated="true" :options="options" :events="events" />
      <template v-if="viewer">
        <html-overlay :viewer="viewer" />
        <mouse-tracker :viewer="viewer" />
        <toolbar />
      </template>
      <selected-room v-if="selected_room" />
      <item-panel v-else :viewer="viewer" />
    </div>
    <unrest-ui />
  </div>
</template>

<script>
import HtmlOverlay from './HtmlOverlay.vue'
import ItemPanel from './ItemPanel.vue'
import MouseTracker from './MouseTracker.vue'
import SelectedRoom from './SelectedRoom.vue'
import Toolbar from './Toolbar.vue'

export default {
  __route: {
    path: '/editor/',
  },
  components: { HtmlOverlay, ItemPanel, MouseTracker, SelectedRoom, Toolbar },
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
    css() {
      return {
        wrapper: ['viewer-wrapper', { '-overzoomed': this.overzoomed }],
      }
    },
    selected_room() {
      return this.$store.viewer.getSelectedRoom()
    },
  },
}
</script>
