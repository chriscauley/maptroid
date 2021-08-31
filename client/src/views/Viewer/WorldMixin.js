import Game from '@/models/Game'

export default {
  data() {
    return { game: null, world: null }
  },
  mounted() {
    const world_id = Number(this.$route.params.world_id)
    Promise.all([
      this.$store.world.fetchOne(world_id),
      this.$store.item.getAll({ world_id }),
      this.$store.room.getAll({ world_id }),
    ]).then(([world, items, rooms]) => {
      this.world = world
      this.game = new Game()
      this.game.populate({ world, items, rooms })
      // world.MITT_EVENTS.forEach((event) => {
      //   this[event] && world.on(event, this[event])
      // })
      // this.onViewerDone = () => world.populate({ items, rooms })
    })
  },
}
