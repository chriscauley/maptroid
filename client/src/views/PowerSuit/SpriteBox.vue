<template>
  <div class="power-suit__sprite">
    <div class="power-suit__frames">
      <img v-for="(frame, i) in frames" :src="frame" :key="i" />
    </div>
    <img :src="frames[frame_no % frames.length]" width="300" />
  </div>
</template>

<script>
export default {
  props: {
    sprite: Object,
    rects: Array,
    img: Object,
  },
  data() {
    const interval = setInterval(() => this.frame_no++, 1000)
    return { frame_no: 0, interval }
  },
  computed: {
    frames() {
      const rects = this.sprite.indexes.map((i) => this.rects[i])
      const W = Math.max(...rects.map((r) => r[2]))
      const H = Math.max(...rects.map((r) => r[3]))
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')
      return rects.map(([sx, sy, sw, sh]) => {
        ctx.clearRect(0, 0, W, H)
        ctx.drawImage(this.img, sx, sy, sw, sh, 0, 0, sw, sh)
        return canvas.toDataURL()
      })
    },
  },
  unmounted() {
    clearInterval(this.interval)
  },
}
</script>
