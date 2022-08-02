<template>
  <div v-if="room">
    <h2>Splitting Room #{{ room.id }} - {{ room.slug }}</h2>
  </div>
</template>

<script>
export default {
  __route: {
    path: '/staff/split-room/:world_slug/:room_id/',
  },
  computed: {
    world() {
      return this.$store.route.world
    },
    room() {
      const room_id = parseInt(this.$route.params.room_id)
      return this.world && this.$store.world_rooms.find((r) => r.id === room_id)
    },
  },
}
</script>
