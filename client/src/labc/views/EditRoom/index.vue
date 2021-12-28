<template>
  <div v-if="room" class="game-editor">
    <game-canvas :game="game" @click="click" />
    <div class="mouse-text" :style="mouse.style">
      <div v-for="(text, i) in mouse.children" :key="i">{{ text }}</div>
    </div>
    <toolbar />
  </div>
</template>

<script>
import Fraction from 'fraction.js'
import Mousetrap from '@unrest/vue-mousetrap'

import GameCanvas from '@/components/Game'
import Game from '@/game/Game'
import vec from '@/game/vec'
import Toolbar from './Toolbar'

export default {
  __route: {
    path: '/room/edit/:room_id/',
  },
  components: { GameCanvas, Toolbar },
  mixins: [Mousetrap.Mixin],
  data() {
    return { game: null, mouse: {} }
  },
  computed: {
    mousetrap() {
      return {}
    },
    room() {
      return this.$store.room.getOne(this.$route.params.room_id)
    },
  },
  mounted() {
    this.game = new Game(document.getElementById('game-canvas'))
    this.game.on('draw', this.draw)
  },
  unmounted() {
    // TODO use mitt instead of EventEmitter and do the game.off from inside gmae.close()
    this.game.close()
    this.game.off('draw', this.draw)
  },
  methods: {
    click() {
      const { selected_tool } = this.$store.tool.state
      if (selected_tool === 'shape') {
        const polyline = this.$store.tool.state.polyline || []
        polyline.push(vec.round(this.game.mouse._world_xy, 0.5))
        this.$store.tool.patch({ polyline })
      }
    },

    draw() {
      const { selected_tool } = this.$store.tool.state
      this.mouse_text = null
      if (selected_tool === 'shape') {
        const polyline = this.$store.tool.state.polyline || []
        const mouse_xy = vec.round(this.game.mouse._world_xy, 0.5)
        this.game.ui = [
          { type: 'dot', xy: mouse_xy },
          { type: 'polyline', xys: polyline },
        ]
        this.mouse.children = [mouse_xy.toString()]
        this.mouse.style = {
          left: this.game.mouse.canvas_xy[0] * this.game.zoom + 'px',
          top: -this.game.mouse.canvas_xy[1] * this.game.zoom + 'px',
        }
        if (polyline.length) {
          const xys = [polyline[polyline.length - 1], mouse_xy]
          this.game.ui.push({ type: 'polyline', lineDash: [0.1, 0.1], xys })
          const slope = vec.slope(xys)
          if (1 / slope) {
            // rules out infinity and NaN (vertical lines)
            this.mouse.children.push(new Fraction(slope).toFraction(true))
          }
        }
      } else {
        this.game.ui = [{ type: 'box', xy: this.game.mouse.world_xy }]
      }
    },
  },
}
</script>
