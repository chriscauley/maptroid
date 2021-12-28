export default {
  mounted() {
    document.addEventListener('click', this.$store.route.blurItem)
    const item_id = parseInt(this.$route.query.item)
    if (item_id) {
      const interval = setInterval(() => {
        const item = this.$store.route.zone_items.find((i) => i.id === item_id)
        if (item && this.osd_store.viewer?.isOpen()) {
          this.gotoItem(item)
          clearInterval(interval)
        }
      }, 100)
    }
    const room_id = parseInt(this.$route.query.room)
    if (room_id) {
      const interval = setInterval(() => {
        const room = this.$store.route.world_rooms.find((i) => i.id === room_id)
        if (room && this.osd_store.viewer?.isOpen()) {
          this.gotoRoom(room)
          clearInterval(interval)
        }
      }, 100)
    }
  },
  unmounted() {
    document.removeEventListener('click', this.$store.route.blurItem)
  },
}
