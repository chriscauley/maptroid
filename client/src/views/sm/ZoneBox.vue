<template>
  <div class="sm-zone-box" :style="style" :title="zone.name">
    <unrest-draggable @drag="drag" />
    <room-box v-for="room in rooms" :key="room.id" :room="room" />
  </div>
</template>

<script>
import RoomBox from './RoomBox.vue'

export default {
  components: { RoomBox },
  inject: ['osd_store'],
  props: {
    zone: Object,
  },
  data() {
    return { raw_bounds: this.zone.data.world.bounds.slice() }
  },
  computed: {
    style() {
      const [x, y, width, height] = this.zone.data.world.bounds
      return {
        height: `${100}%`,
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: `${100}%`,
      }
    },
    rooms() {
      return this.$store.route.world_rooms.filter((r) => r.zone === this.zone.id)
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
