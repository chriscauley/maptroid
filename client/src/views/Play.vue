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

import { fromDb } from '@/game/Room'
import Game from '@/game/Game'
import _games from '@/game/_games'

export default {
  __route: {
    path: '/play/string_room/:string_room_id/',
    alias: ['/play/:world_slug/:room_id/'],
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
  async mounted() {
    const options = {}
    const { string_room_id } = this.$route.params
    const room_id = parseInt(this.$route.params.room_id)
    if (string_room_id) {
      options.string_room = _games.strings[string_room_id]
    } else {
      // room_id
      await this.$store.route.fetchReady()
      const room = this.$store.route.world_rooms.find((r) => r.id === room_id)
      options.room = fromDb(room)
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
