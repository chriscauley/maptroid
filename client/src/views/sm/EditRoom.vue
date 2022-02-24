<template>
  <teleport to="body" v-if="room">
    <unrest-modal @close="$store.local.save({ editing_room: null })">
      <unrest-toolbar :storage="item_storage" class="-relative">
        <template #buttons>
          <div :class="invertClass" title="invert" @click="toggleInvert">
            <i class="fa fa-file-image" />
          </div>
          <unrest-dropdown :items="zone_items" class="btn -info">
            {{ room_zone }}
          </unrest-dropdown>
          <unrest-dropdown :items="png_items" class="btn -info">
            <i class="fa fa-link" />
          </unrest-dropdown>
        </template>
      </unrest-toolbar>
      <room-box :mode="selected.tool" :variant="selected.variant" :room="room" />
    </unrest-modal>
  </teleport>
</template>

<script>
import RoomBox from './RoomBox.vue'
import ToolStorage from '@/components/unrest/ToolStorage'
import Item from '@/models/Item'

const tools = [
  { slug: 'item', variants: Item.packs, icon: (_, v) => `sm-item -${v}` },
  { slug: 'item', variants: Item.beams, icon: (_, v) => `sm-item -${v}` },
  { slug: 'item', variants: Item.abilities, icon: (_, v) => `sm-item -${v}` },
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
    invertClass() {
      const { invert_layers } = this.room.data
      return ['btn', invert_layers ? '-primary' : '-secondary']
    },
    selected() {
      return this.item_storage.state.selected
    },
    room() {
      const room_id = this.$store.local.state.editing_room
      return room_id && this.$store.route.world_rooms.find((r) => r.id === room_id)
    },
    room_zone() {
      return this.$store.route.all_zones.find((z) => z.id === this.room.zone)?.name
    },
    zone_items() {
      return this.$store.route.all_zones.map((z) => ({
        text: z.name,
        click: () => {
          const room = this.room
          room.zone = z.id
          this.$store.room.save(room)
        },
      }))
    },
    png_items() {
      const { key } = this.room
      const world = this.$store.route.world.slug
      const layers = ['layer-1', 'layer-2', 'bts']
      const items = layers.map((layer) => ({
        href: `/media/smile_exports/${world}/${layer}/${key}`,
        text: `smile ${layer}`,
      }))
      layers.push('layer-2+layer-1')
      layers.forEach((layer) =>
        items.push({
          href: `/media/sm_cache/${world}/${layer}/${key}`,
          text: `sm_cache ${layer}`,
        }),
      )
      items.push({
        text: 'plm_enemies',
        href: `/media/plm_enemies/${world}/${key}`,
      })
      items.unshift({
        text: 'admin',
        href: `/djadmin/maptroid/room/${this.room.id}/`,
      })
      return items
    },
  },
  methods: {
    toggleInvert() {
      const { room } = this
      if (!room.data.invert_layers) {
        room.data.invert_layers = true
      } else {
        delete room.data.invert_layers
      }
      this.$store.room.save(room)
    },
  },
}
</script>
