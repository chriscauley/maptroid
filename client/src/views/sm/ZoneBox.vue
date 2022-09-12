<template>
  <div :class="css" :style="style" :title="zone.name">
    <unrest-draggable @drag="drag" v-if="move_zones" class="sm-zone-box__move" />
    <room-box v-for="room in rooms" :key="room.id" :room="room" />
  </div>
  <router-link
    v-if="zone.slug === 'syl__maze'"
    class="syl-maze-link"
    to="/app/syl/"
    :style="jackie_style"
  >
    <img src="/static/jackie-chan-wtf.png" />
  </router-link>
</template>

<script>
import RoomBox from './RoomBox.vue'

export default {
  components: { RoomBox },
  inject: ['osd_store', 'tool_storage'],
  props: {
    zone: Object,
  },
  data() {
    return { raw_bounds: this.zone.data.world.bounds.slice() }
  },
  computed: {
    move_zones() {
      return this.tool_storage.state.selected.tool === 'move_zone'
    },
    css() {
      return `sm-zone-box -zone-${this.zone.slug}`
    },
    style() {
      const [x, y] = this.zone.data.world.bounds
      return {
        height: `${100}%`,
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: `${100}%`,
      }
    },
    jackie_style() {
      const [x, y] = this.zone.data.world.bounds
      return {
        height: '100%',
        left: `${x * 100}%`,
        position: 'absolute',
        top: `${y * 100}%`,
        width: '100%',
        'z-index': 120,
      }
    },
    rooms() {
      return this.$store.route.world_rooms.filter((r) => !r.data.hidden && r.zone === this.zone.id)
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
