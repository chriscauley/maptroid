<template>
  <unrest-dropdown class="btn -danger" v-if="items.length" :items="items">
    <i class="fa fa-exclamation-circle" />
    {{ items.length }}
  </unrest-dropdown>
</template>

<script>
import { sortBy } from 'lodash'

const MATCHES = ['sm-cre-hex -unknown', 'sm-cre-hex -respawn']

export default {
  inject: ['map_props', 'tool_storage'],
  props: {
    rooms: Array,
  },
  emits: ['highlight'],
  computed: {
    items() {
      if (!['move_room', 'edit_room'].includes(this.tool_storage.state.selected.tool)) {
        return []
      }
      const { rooms } = this.map_props
      let items = rooms.map((room) => {
        const block_map = this.$store.route.getRoomBlocks(room)
        const count = Object.values(block_map).filter((k) => MATCHES.includes(k)).length
        return { count, room, id: room.id }
      })
      items = items.filter((i) => i.count)
      items = sortBy(items, 'count')
      return [
        {
          text: 'Highlght',
          click: () =>
            this.$emit(
              'highlight',
              this.items.map((i) => i.id),
            ),
        },
        ...items.map(({ room, count, id }) => ({
          id,
          count,
          text: `${count} #${room.id} ${room.name || room.data.zone.bounds}`,
          click: () => this.$store.local.save({ editing_room: room.id }),
        })),
      ]
    },
  },
}
</script>
