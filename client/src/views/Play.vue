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
import gamepad from '@/unrest/gamepad/gamepad'

import Game from '@/game/Game'

export default {
  __route: {
    path: '/play/:world_slug/:room_id/',
  },
  components: { DebugGame, GameCanvas },
  mixins: [Mousetrap.Mixin],
  data() {
    const { buttonUp, buttonDown } = this
    return { game: null, gamepad: gamepad({ buttonUp, buttonDown }) }
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
          '+,=': () => this.game.adjustZoom(1),
          '-,_': () => this.game.adjustZoom(-1),
          0: () => (this.game.zoom = 32),
        })
      }
      return mousetrap
    },
  },
  async mounted() {
    await this.$store.route.fetchReady()
    const room_id = parseInt(this.$route.params.room_id)
    const { world, world_rooms: rooms, zones } = this.$store.route
    const options = { world, rooms, zones, room_id }

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
    buttonUp(e) {},
    buttonDown(e) {},
  },
}
</script>
