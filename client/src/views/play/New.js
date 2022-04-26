export default {
  __route: {
    path: '/play/new/:world_slug/:room_id?',
  },
  render: () => 'Loading...',
  async mounted() {
    let room_id = parseInt(this.$route.params.room_id)
    if (!room_id) {
      await this.$store.route.fetchReady()
      const room = this.$store.route.world_rooms.find((r) => {
        return Object.values(r.data.plm_overrides || {}).find((v) => v === 'ship')
      })
      if (!room) {
        throw 'Not implemented: Unable to find room'
      }
      room_id = room.id
    }
    const options = {
      room_id,
      world_id: this.$store.route.world.id,
    }
    this.$store.play.save(options).then((result) => this.$router.replace(`/play/${result.id}/`))
  },
}
