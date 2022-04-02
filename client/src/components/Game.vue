<template>
  <canvas
    id="game-canvas"
    width="1024"
    height="768"
    ref="canvas"
    @click="click"
    @mousemove="mousemove"
  />
</template>

<script>
export default {
  props: {
    game: Object,
  },
  emits: ['click', 'mousemove'],
  methods: {
    click(e) {
      this.$emit('click', e, this.game.click(e))
    },
    mousemove(e) {
      this.$emit('mousemove', e, this.game.mousemove(e))
    },
  },
}
</script>
