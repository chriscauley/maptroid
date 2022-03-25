<template>
  <unrest-dropdown class="btn -danger" v-if="overlap_items.length" :items="overlap_items">
    <i class="fa fa-exclamation-circle" />
    {{ overlap_items.length }}
  </unrest-dropdown>
</template>

<script>
import { sortBy } from 'lodash'

export default {
  inject: ['map_props', 'tool_storage'],
  computed: {
    overlap_items() {
      if (!['move_room', 'edit_room'].includes(this.tool_storage.state.selected.tool)) {
        return []
      }
      const { rooms } = this.map_props

      // How many times does an zone_xy appear in each room?
      const xy_map = {}
      rooms.forEach((r) => {
        const [x0, y0, width, height] = r.data.zone.bounds
        for (let dx = 0; dx < width; dx++) {
          const x = x0 + dx
          for (let dy = 0; dy < height; dy++) {
            const y = y0 + dy
            if (!r.data.holes.find((hole) => dx === hole[0] && dy === hole[1])) {
              const xy = [x, y]
              xy_map[xy] = xy_map[xy] || []
              xy_map[xy].push(r.id)
            }
          }
        }
      })

      // Filter out the xys with one room, and then figure out how many times each room appears
      const room_counts = {}
      const binRoomIds = (room_ids) =>
        room_ids.forEach((id) => (room_counts[id] = (room_counts[id] || 0) + 1))
      Object.values(xy_map)
        .filter((i) => i.length > 1)
        .forEach(binRoomIds)

      // Create items for each room to appear in dropdown
      const items = Object.entries(room_counts).map(([room_id, count]) => {
        const room = rooms.find((r) => r.id === parseInt(room_id))
        return {
          count,
          text: `${count} #${room_id} ${room.name || room.data.zone.bounds}`,
          click: () => this.$store.local.save({ editing_room: room.id }),
        }
      })

      return sortBy(items, 'count').reverse()
    },
  },
}
</script>
