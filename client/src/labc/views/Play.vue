<template>
  <div>
    <game-canvas :game="game" @click="click" />
    <debug-game :game="game" v-if="game" />
  </div>
</template>

<script>
import Mousetrap from '@unrest/vue-mousetrap'
import DebugGame from '@/components/DebugGame'
import GameCanvas from '@/components/Game'

import Game from '@/game/Game'
import _games from '@/game/_games'

export default {
  __route: {
    path: '/play/:type/:room_id/',
  },
  components: { DebugGame, GameCanvas },
  mixins: [Mousetrap.Mixin],
  data() {
    return { game: null }
  },
  computed: {
    mousetrap() {
      const mousetrap = { enter: this.togglePause }
      if (this.game?.player && !this.game.paused) {
        const { up, left, right, down, aimup, aimdown, shoot1, jump } = this.game.actions
        Object.assign(mousetrap, {
          up,
          left,
          right,
          down,
          q: aimup,
          a: aimdown,
          z: shoot1,
          x: jump,
        })
      }
      return mousetrap
    },
  },
  mounted() {
    const options = {}
    const { type, room_id } = this.$route.params
    if (type === 'string_room') {
      options.string_room = _games.strings[room_id]
    }
    this.game = new Game(document.getElementById('game-canvas'), options)
    this.game.on('draw', this.draw)
    this.game.paused = false
  },
  unmounted() {
    this.game.close()
    this.game.off('draw', this.draw)
  },
  methods: {
    click(_event, data) {
      console.log(data) // eslint-disable-line
    },
    draw(_event, _data) {
      this.game.ui = [{ type: 'box', xy: this.game.mouse.world_xy }]
    },
    togglePause() {
      this.game.paused = !this.game.paused
    },
  },
}
</script>
