<template>
  <div :class="viewer_class">
    <open-seadragon :pixelated="true" :options="options" :events="events" />
    <template v-if="viewer">
      <html-overlay :viewer="viewer" />
      <mouse-tracker :viewer="viewer" />
      <toolbar />
    </template>
    <selected-room v-if="$store.viewer.getSelectedRoom()" />
    <item-panel v-else :viewer="viewer" />
  </div>
</template>

<script>
import HtmlOverlay from './HtmlOverlay.vue'
import ItemPanel from './ItemPanel.vue'
import MouseTracker from './MouseTracker.vue'
import SelectedRoom from './SelectedRoom.vue'
import Toolbar from './Toolbar.vue'
import ViewerMixin from '../Viewer/Mixin'

export default {
  __route: {
    path: '/editor/',
  },
  components: { HtmlOverlay, ItemPanel, MouseTracker, SelectedRoom, Toolbar },
  mixins: [ViewerMixin],
}
</script>
