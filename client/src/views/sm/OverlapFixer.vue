<template>
  <teleport to="body" v-if="room">
    <unrest-modal @close="$store.local.save({ overlap_room: null })">
      <room-box mode="overlap" :room="room" />
    </unrest-modal>
  </teleport>
</template>

<script>
import RoomBox from './RoomBox.vue'

export default {
  components: { RoomBox },
  computed: {
    room() {
      const room_id = this.$store.local.state.overlap_room
      return room_id && this.$store.route.world_rooms.find((r) => r.id === room_id)
    },
  },
}
</script>
