<template>
  <div class="flex-grow">
    <div class="viewer-wrapper" v-if="world">
      <div class="unrest-floating-actions -left">
        <div class="btn -primary" @click="locked = !locked">
          <i :class="`fa fa-${locked ? 'lock' : 'unlock-alt'}`" />
        </div>
      </div>
      <open-seadragon :pixelated="true" :options="viewer_options" :events="viewer_events" />
      <template v-if="viewer">
        <html-overlay :viewer="viewer" :world="world" :screens="screens">
          <item-box
            v-for="(item, i) in items"
            :item="item"
            :world="world"
            :key="item.id"
            :target_number="i + 1"
            :game="game"
            @click="clickItem(item)"
          />
        </html-overlay>
        <svg-overlay :viewer="viewer" :world="world" :arrows="arrows" />
        <viewer-panel :room="current_room" :items="items" :game="game" />
      </template>
    </div>
  </div>
</template>

<script>
import Mousetrap from '@unrest/vue-mousetrap'

import HtmlOverlay from './HtmlOverlay.vue'
import ItemBox from './ItemBox.vue'
import ViewerPanel from './Panel.vue'
import SvgOverlay from './SvgOverlay.vue'
import ViewerMixin from './Mixin'
import WorldMixin from './WorldMixin'
import Room from '@/models/Room'

export default {
  __route: {
    path: '/viewer/:world_id',
  },
  components: { HtmlOverlay, ItemBox, SvgOverlay, ViewerPanel },
  mixins: [ViewerMixin, WorldMixin, Mousetrap.Mixin],
  data() {
    return { locked: true }
  },
  computed: {
    items() {
      const items = this.locked ?
            this.game.getItemsByRoomId(this.current_room.id) :
            this.$store.item.getAll({ world_id: this.world.id })

      return items.filter((i) => i.class === 'item' || i.class === 'boss')
    },
    screens() {
      const out = []
      if (!this.current_room) {
        return out
      }
      this.visible_xys.forEach((xy) => {
        if (Room.containsXY(this.game.state.room, xy)) {
          return
        }
        out.push({ x: xy[0], y: xy[1], class: '-black' })
      })
      const { x, y } = this.viewer.world.getItemAt(0).getContentSize()
      const W = x / this.world.map_screen_size
      const H = y / this.world.map_screen_size
      const [min_x, min_y] = this.visible_xys[0]
      const [max_x, max_y] = this.visible_xys[this.visible_xys.length - 1].map((n) => n + 1)
      const width = max_x - min_x
      if (this.locked) {
        out.push({ x: 0, y: 0, width: min_x, height: H, class: '-black' }) // left
        out.push({ x: min_x, y: 0, width, height: min_y, class: '-black' }) // above
        out.push({ x: min_x, y: max_y, width, height: H - max_y, class: '-black' }) // below
        out.push({ x: max_x, y: 0, width: W - max_x, height: H, class: '-black' }) // right
      }
      out.push(this.game_screen)
      return out
    },
    game_screen() {
      const [x, y] = this.game.state.xy
      return { x, y, width: 1, height: 1, class: '-outline-blue' }
    },
    mousetrap() {
      return {
        'up,down,left,right': this.move,
        '1,2,3,4,5,6,7,8,9': this.pressItem,
      }
    },
    arrows() {
      return this.game.getArrows()
    },
  },
  watch: {
    locked: 'updateLocked',
  },
  methods: {
    getViewerOptions() {
      return {
        showNavigator: false,
        tileSources: [this.world.dzi],
      }
    },
    onViewerDone() {
      this.updateLocked()
      this.game.on('goto-room', this.gotoRoom)
      this.game.start()
    },
    clickItem(item) {
      this.game.getItem(item.id)
      this.$store.playthrough.save(this.game.playthrough)
    },
    pressItem(e) {
      this.game.getItem(this.items[Number(e.key) - 1].id)
    },
    move(e) {
      const direction = e.key.replace('Arrow', '').toLowerCase()
      this.game.move(direction)
      this.$store.playthrough.save(this.game.playthrough)
    },
    updateLocked() {
      this.viewer.setMouseNavEnabled(!this.locked)
    },
  },
}
</script>
