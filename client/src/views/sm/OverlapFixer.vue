<template>
  <unrest-dropdown :items="overlap_items">
    <div class="btn btn-primary"><i class="fa fa-layer" /> {{ overlap_items.length }}</div>
    <teleport to="body" v-if="fixing">
      <unrest-modal @close="fixing = null">
        <room-box mode="overlap" :room="fixing" />
      </unrest-modal>
    </teleport>
  </unrest-dropdown>
</template>

<script>
import { range, sortBy } from 'lodash'

import RoomBox from './RoomBox.vue'
import vec from '@/lib/vec'

export default {
  components: { RoomBox },
  props: {
    rooms: Array,
  },
  data() {
    return { fixing: null }
  },
  computed: {
    overlap_items() {
      const index_map = {}
      this.rooms.forEach((room) => {
        room.data.holes = room.data.holes || []
        const [x, y, width, height] = room.data.zone.bounds
        range(x, x + width).forEach((zone_x) => {
          range(y, y + height).forEach((zone_y) => {
            const zone_xy = [zone_x, zone_y]
            if (room.data.holes.find((xy) => vec.isEqual(xy, [zone_x - x, zone_y - y]))) {
              return
            }
            index_map[zone_xy] = index_map[zone_xy] || []
            index_map[zone_xy].push(room.id)
          })
        })
      })
      const overlapping = []
      Object.values(index_map)
        .filter((ids) => ids.length > 1)
        .forEach((room_ids) => {
          room_ids.filter((i) => !overlapping.includes(i)).forEach((i) => overlapping.push(i))
        })
      let overlap_rooms = overlapping.map((id) => this.rooms.find((r) => r.id === id))
      if (overlap_rooms.length === 0) {
        overlap_rooms = this.rooms
      }
      return sortBy(overlap_rooms, 'name').map((room) => {
        const [_x, _y, width, height] = room.data.zone.bounds
        return {
          text: `${width},${height} ${room.name}`,
          click: () => (this.fixing = room),
        }
      })
    },
  },
}
</script>
