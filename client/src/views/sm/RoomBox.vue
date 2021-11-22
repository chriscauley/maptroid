<template>
  <div v-bind="attrs" :class="css" :title="room.name">
    <unrest-draggable @drag="drag" />
  </div>
</template>

<script>
const WORLD = 'super_metroid'

export default {
  inject: ['osd_store'],
  props: {
    room: Object,
  },
  data() {
    return { drag_xy: [0, 0], drag_raw_xy: [0, 0] }
  },
  computed: {
    css() {
      const { zoom } = this.osd_store.state
      // 0.2 is based off observation
      return ['sm-room-box', zoom > 0.2 && 'pixelated']
    },
    attrs() {
      const [x, y, width, height] = this.room.data.zone.bounds
      const zIndex = 100 - width * height
      const { sm_layer } = this.$store.local.state
      return {
        style: {
          backgroundImage: `url("/media/smile_exports/${WORLD}/${sm_layer}/${this.room.key}")`,
          height: `${height * 100}%`,
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          width: `${width * 100}%`,
          zIndex,
        },
      }
    },
  },
  methods: {
    drag(event) {
      this.osd_store.dragRoom(this.room, event._drag.last_dxy)
      this.$store.room2.bounceSave(this.room)
    },
  },
}
</script>
