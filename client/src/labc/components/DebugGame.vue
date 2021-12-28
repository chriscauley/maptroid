<template>
  <code id="debug" style="display: flex">
    <div v-for="(column, ic) in state" :key="ic">
      <div v-for="(row, key) in column" :key="key">{{ key }}: {{ pprint(row) }}</div>
    </div>
  </code>
</template>

<script>
export default {
  props: {
    game: Object,
  },
  data() {
    return { state: {} }
  },
  mounted() {
    this.game.on('draw', this.updateDebugLog)
  },
  unmounted() {
    this.game.off('draw', this.updateDebugLog)
  },
  methods: {
    pprint(i) {
      if (i instanceof Float32Array) {
        i = [...i]
      }
      if (Array.isArray(i)) {
        return i
          .slice()
          .map(this.pprint)
          .join(',')
      } else if (typeof i === 'number') {
        return i.toFixed(2)
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
        Object.assign(state.misc, { position, velocity, scaledVelocity, max_speed_y, gravity })
        Object.assign(state.misc, game.player.state)
        state.misc.isWallsliding = game.player.isWallsliding()

        state.collisions = game.player.collisions
        state.keys = game.player.keys
      }
    },
  },
}
</script>
