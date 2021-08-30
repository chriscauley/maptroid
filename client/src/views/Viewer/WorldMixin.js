import Game from '@/models/Game'

export default {
  data() {
    return { game: null, world: null }
  },
  mounted() {
    Promise.all([
      this.$store.world.fetchOne(1),
      this.$store.item.getAll(),
      this.$store.room.getAll(),
    ]).then(([world, items, rooms]) => {
      this.world = world
      this.game = new Game()
      this.game.populate({ world, items, rooms })
      this.onGameLoad()
      // world.MITT_EVENTS.forEach((event) => {
      //   this[event] && world.on(event, this[event])
      // })
      // this.onViewerDone = () => world.populate({ items, rooms })
    })
  },
  onGameLoad() {
    console.warn('Component does not define on game load')
  },
}
