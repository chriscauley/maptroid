<template>
  <code id="debug" class="debug-game">
    <div v-for="(column, ic) in state" :key="ic">
      {{ ic }}
      <div v-for="(row, key) in column" :key="key">{{ key }}: {{ pprint(row, key) }}</div>
    </div>
  </code>
</template>

<script>
export default {
  props: {
    game: Object,
  },
  data() {
    return { state: { collisions: {} } }
  },
  mounted() {
    this.game.on('draw', this.updateDebugLog)
  },
  unmounted() {
    this.game.off('draw', this.updateDebugLog)
  },
  methods: {
    pprint(i, key) {
      if (key === 'last') {
        return '<<last>>'
      }
      if (i instanceof Float32Array) {
        i = [...i]
      }
      if (Array.isArray(i)) {
        return i
          .slice()
          .map(this.pprint)
          .join(',')
      } else if (typeof i === 'number') {
        return Math.abs(i) % 1 > 0.1 ? i.toFixed(2) : Math.round(i)
      }
      return i
    },
    updateDebugLog() {
      const { state, game } = this
      state.mouse = game.mouse
      state.misc = { frame: game.frame }
      if (game.player) {
        const { position } = game.player.body
        const { velocity, gravity, scaledVelocity } = game.player
        const max_speed_y = Math.max(state.player?.max_speed_y || 0, Math.abs(velocity[1]))
        state.collisions = game.player.collisions
        Object.assign(state.misc, { position, velocity, scaledVelocity, max_speed_y, gravity })
        Object.assign(state.misc, game.player.state)

        state.keys = game.player.keys
      }
      state.misc.fps = (1000 * 60) / (new Date().valueOf() - game.frame_times[0])
    },
  },
}
</script>
