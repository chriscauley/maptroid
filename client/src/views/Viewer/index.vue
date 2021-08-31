<template>
  <div class="flex-grow">
    <div class="viewer-wrapper" v-if="world">
      <open-seadragon :pixelated="true" :options="viewer_options" :events="viewer_events" />
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
import Room from '@/models/Room'

export default {
  __route: {
    path: '/viewer/:world_id',
  },
  components: { HtmlOverlay },
  mixins: [ViewerMixin, WorldMixin],
  computed: {
    screens() {
      const out = []
      this.visible_xys.forEach((xy) => {
        if (Room.containsXY(this.current_room, xy)) {
          return
        }
        out.push({ x: xy[0], y: xy[1], css: '-color-black' })
      })
      const { x, y } = this.viewer.world.getItemAt(0).getContentSize()
      const W = x / this.world.map_screen_size
      const H = y / this.world.map_screen_size
      const [min_x, min_y] = this.visible_xys[0]
      const [max_x, max_y] = this.visible_xys[this.visible_xys.length - 1].map((n) => n + 1)
      const width = max_x - min_x
      out.push({ x: 0, y: 0, width: min_x, height: H, css: '-color-black' })
      out.push({ x: min_x, y: 0, width, height: min_y, css: '-color-black' })
      out.push({ x: min_x, y: max_y, width, height: H - max_y, css: '-color-black' })
      out.push({ x: max_x, y: 0, width: W - max_x, height: H, css: '-color-black' })
      return out
    },
  },
  methods: {
    getViewerOptions() {
      return { showNavigator: false, tileSources: [this.world.dzi] }
    },
    onGameLoad() {
      // TODO use wordl.start_xy instead of item.type === 'ship'
      const ship = this.game.getItemsByType('ship')?.[0]
      this.current_room = this.game.getRoomByXY(ship.world_xy)
    },
  },
}
</script>
