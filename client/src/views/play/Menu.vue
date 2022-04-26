<template>
  <div v-if="$store.route.world">
    <div v-for="room in rooms" :key="room.id">
      <router-link :to="`/play/${$store.route.world.slug}/${room.id}/`">
        {{ room.text }}
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  __route: {
    path: '/play/:world_slug/',
  },
  computed: {
    rooms() {
      const match = ['save-station', 'ship']
      const rooms = this.$store.route.world_rooms.filter((r) =>
        Object.values(r.data.plm_overrides || {}).find((plm) => match.includes(plm)),
      )
      return rooms.map((room) => {
        const zone = this.$store.route.zones.find((z) => z.id === room.zone)
        const text = `${zone?.name || 'Unknown'} #${room.id}`
        return { text, id: room.id }
      })
    },
  },
}
</script>
