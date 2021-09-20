<template>
  <div class="list-group editor-warnings">
    <div v-for="item in misplaced_items" :key="item.id" class="list-group-item">
      <div>#{{ item.id }}: {{ item.type }}</div>
      <i class="fa fa-search" @click="gotoItem(item)" />
    </div>
    <div v-for="(rooms, key) in overlapped_rooms" :key="key" class="list-group-item">
      <div v-for="room in rooms" :key="room.id">
        #{{ room.id }} <i class="fa fa-search" @click="selectRoom(room)" />
      </div>
      <div class="flex-grow" />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    items: Array,
    gotoItem: Function,
    gotoRoom: Function,
    game: Object,
  },
  computed: {
    overlapped_rooms() {
      return this.game.getWarnings()
    },
    misplaced_items() {
      return this.items.filter((i) => {
        const xy = i.screen_xy
        return xy[0] > 15 || xy[0] < 0 || xy[1] > 15 || xy[1] < 0
      })
    },
  },
  methods: {
    selectRoom(room) {
      this.gotoRoom(room)
      this.$store.viewer.patch({ selected_room_id: room.id })
    },
  },
}
</script>
