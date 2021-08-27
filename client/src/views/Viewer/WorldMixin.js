export default {
  data() {
    return { world: null }
  },
  mounted() {
    Promise.all([
      this.$store.world.fetchOne(1),
      this.$store.item.getAll(),
      this.$store.room.getAll(),
    ]).then(([world, items, rooms]) => {
      this.world = world
      world.MITT_EVENTS.forEach((event) => {
        this[event] && world.on(event, this[event])
      })
      this.onViewerDone = () => world.populate({ items, rooms })
    })
  },
}
