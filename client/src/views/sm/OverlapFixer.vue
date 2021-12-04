<template>
  <teleport to="body" v-if="room">
    <unrest-modal @close="$store.local.save({ overlap_room: null })">
      <unrest-toolbar :storage="item_storage" class="-relative" />
      <room-box :mode="selected.tool" :variant="selected.variant" :room="room" />
    </unrest-modal>
  </teleport>
</template>

<script>
import RoomBox from './RoomBox.vue'
import ToolStorage from '@/components/unrest/ToolStorage'

const items = ['missile', 'super-missile', 'energy-tank', 'power-bomb']
const tools = [
  { slug: 'item', variants: items, icon: (_, v) => `sm-item -${v}` },
  { slug: 'overlap', icon: 'fa fa-layer-group' },
]

export default {
  components: { RoomBox },
  data() {
    return {
      item_storage: ToolStorage('tools__sm-item', { tools }),
    }
  },
  computed: {
    selected() {
      return this.item_storage.state.selected
    },
    room() {
      const room_id = this.$store.local.state.overlap_room
      return room_id && this.$store.route.world_rooms.find((r) => r.id === room_id)
    },
  },
}
</script>
