<template>
  <div>
    <game-canvas :game="game" @click="click" />
    <debug-game :game="game" v-if="game" />
    <pause-menu v-if="paused" :game="game" />
  </div>
</template>

<script>
import Mousetrap from '@unrest/vue-mousetrap'
import DebugGame from '@/components/DebugGame'
import PauseMenu from '@/components/PauseMenu.vue'
import GameCanvas from '@/components/Game'

import Game from '@/game/Game'

export default {
  __route: {
    path: '/play/:world_slug/:play_id/',
  },
  components: { DebugGame, GameCanvas, PauseMenu },
  mixins: [Mousetrap.Mixin],
  data() {
    return { game: null, paused: false }
  },
  computed: {
    mousetrap() {
      const mousetrap = { enter: () => this.game?.togglePause() }
      if (this.game?.player && !this.game.paused) {
        const {
          up,
          left,
          right,
          down,
          aimup,
          aimdown,
          shoot1,
          shoot2,
          jump,
          run,
          special,
        } = this.game.actions
        Object.assign(mousetrap, {
          'up,shift+up': up,
          'left,shift+left': left,
          'right,shift+right': right,
          'down,shift+down': down,
          'q,Q': aimup,
          'a,A': aimdown,
          'z,Z': shoot1,
          'w,W': shoot2,
          'x,X': jump,
          'b,B': special,
          shift: run,
          '+,=': () => this.game.adjustZoom(1),
          '-,_': () => this.game.adjustZoom(-1),
          0: () => (this.game.zoom = 32),
        })
      }
      return mousetrap
    },
  },
  async mounted() {
    await this.$store.route.fetchItemsReady()
    const play = await this.$store.play.fetchOne(this.$route.params.play_id)
    const { world, world_rooms: rooms, world_items: items, zones } = this.$store.route
    const options = { world, rooms, zones, items, ...play }

    this.game = new Game(document.getElementById('game-canvas'), options)
    this.game.on('draw', this.draw)
    this.game.on('save', this.save)
    this.game.on('pause', () => (this.paused = this.game.paused))
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
    save(event) {
      this.$store.play.save(event.options)
      this.$ui.toast.success('Game saved!')
    },
  },
}
</script>
