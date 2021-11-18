<template>
  <div :class="css" :style="style" :title="zone.name">
    <img :src="`/static/dread/zone_shapes/${zone.slug}.png`" @load="onload" ref="img" />
    <unrest-draggable v-if="$route.query.mode === 'edit'" @drag="drag" @dragend="dragend" />
    <router-link v-else :to="`/dread/${zone.slug}/`" />
  </div>
</template>

<script>
export default {
  props: {
    zone: Object,
    osd_store: Object,
  },
  data() {
    return { width: 0, height: 0, dragging: false }
  },
  computed: {
    css() {
      return ['zone-box', this.dragging && '-dragging']
    },
    style() {
      if (!this.width) {
        return { display: 'none' }
      }
      const { width, height } = this
      const [x, y] = this.zone.data.world.center_xy
      const scalePx = (i) => `${(i / 1280) * 100}%`
      const percent = (i) => `${i * 100}%`
      return {
        height: scalePx(height),
        left: percent(x),
        top: percent(y),
        width: scalePx(width),
      }
    },
  },
  methods: {
    onload() {
      const { width, height } = this.$refs.img
      this.width = width
      this.height = height
    },
    drag(event) {
      this.dragging = true
      this.osd_store.dragZone(this.zone, event)
      this.$store.zone.bounceSave(this.zone)
    },
    dragend() {
      this.dragging = false
    },
  },
}
</script>
