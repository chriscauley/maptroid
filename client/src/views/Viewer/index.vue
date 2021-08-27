<template>
  <div class="flex-grow">
    <div class="viewer-wrapper" v-if="world">
      <open-seadragon :pixelated="true" :options="options" :events="events" />
      <template v-if="viewer">
        <html-overlay :viewer="viewer" :world="world" :screens="screens" :items="visible_items" />
      </template>
    </div>
  </div>
</template>

<script>
import HtmlOverlay from './HtmlOverlay.vue'
import ViewerMixin from './Mixin'
import WorldMixin from './WorldMixin'

export default {
  __route: {
    path: '/',
  },
  components: { HtmlOverlay },
  mixins: [ViewerMixin, WorldMixin],
  computed: {
    screens() {
      const out = []
      this.visible_xys.forEach((xy) => {
        if (this.current_room.containsXY(xy)) {
          return
        }
        out.push({ x: xy[0], y: xy[1], color: 'black' })
      })
      const { W, H } = this.world
      const [min_x, min_y] = this.visible_xys[0]
      const [max_x, max_y] = this.visible_xys[this.visible_xys.length - 1].map((n) => n + 1)
      const width = max_x - min_x
      out.push({ x: 0, y: 0, width: min_x, height: H, color: 'black' })
      out.push({ x: min_x, y: 0, width, height: min_y, color: 'black' })
      out.push({ x: min_x, y: max_y, width, height: H - max_y, color: 'black' })
      out.push({ x: max_x, y: 0, width: W - max_x, height: H, color: 'black' })
      return out
    },
  },
  methods: {
    getViewerOptions() {
      return { showNavigator: false }
    },
  },
}
</script>
