<template>
  <div class="power-suit__sprite">
    <div class="power-suit__frames">
      <div v-for="(frame, i) in frames" :key="i" :class="frameClass(i)">
        <img :src="frame" />
      </div>
    </div>
    <img :src="getFrame(0)" width="100" />
    <!-- <unrest-modal>foo</unrest-modal> -->
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
    return { frame_no: 0, interval: 250, timeout: null }
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
        const dx = Math.floor((W - sw) / 2)
        const dy = Math.floor((H - sh) / 2)
        ctx.drawImage(this.img, sx, sy, sw, sh, dx, dy, sw, sh)
        return canvas.toDataURL()
      })
    },
  },
  mounted() {
    this.tick()
  },
  unmounted() {
    clearTimeout(this.timeout)
  },
  methods: {
    tick() {
      clearTimeout(this.timeout)
      this.frame_no++
      this.timeout = setTimeout(this.tick, this.interval)
    },
    frameClass(i) {
      return ['power-suit__frame', this.frame_no % this.frames.length === i && '-active']
    },
    getFrame(di) {
      const i = (this.frame_no + di) % (this.frames.length || 1)
      return this.frames[i]
    },
  },
}
</script>
