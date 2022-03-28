<template>
  <unrest-dropdown class="btn -danger" v-if="items.length" :items="items">
    <i class="fa fa-exclamation-circle" />
    {{ items.length - 1 }}
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
        return { count, room, id: room.id, zone_id: room.zone }
      })
      items = items.filter((i) => i.count)
      items = sortBy(items, 'count')
      if (!items.length) {
        return []
      }
      if (!this.$store.route.zone) {
        const count_by_zone = {}
        items.forEach((i) => {
          count_by_zone[i.zone_id] = (count_by_zone[i.zone_id] || 0) + 1
        })
        return this.$store.route.zones.map((zone) => ({
          text: `${count_by_zone[zone.id]} - ${zone.name}`,
          to: { params: { zone_slug: zone.slug } },
        }))
      }
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
