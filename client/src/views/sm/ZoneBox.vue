<template>
  <div class="sm-zone-box" :style="style" :title="zone.name">
    <unrest-draggable @drag="drag" />
  </div>
</template>

<script>
export default {
  inject: ['osd_store'],
  props: {
    world_rooms: Array,
    zone: Object,
  },
  data() {
    return { raw_bounds: this.zone.data.world.bounds.slice() }
  },
  computed: {
    rooms() {
      return this.world_rooms.filter((r) => (r.zone = this.zone.id))
    },
    style() {
      const [x, y, width, height] = this.zone.data.world.bounds
      return {
        height: `${height * 100}%`,
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: `${width * 100}%`,
      }
    },
  },
  methods: {
    drag(event) {
      this.osd_store.dragZone(this.zone, event._drag.last_dxy)
      this.$store.zone.bounceSave(this.zone)
    },
  },
}
</script>
