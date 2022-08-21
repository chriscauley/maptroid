<template>
  <unrest-dropdown class="btn -danger cre-dropdown" v-if="items.length" :items="items">
    <i class="sm-block -crumble" />
    {{ missing_items.length }}
  </unrest-dropdown>
</template>

<script>
import { sortBy } from 'lodash'
import Room from '@/models/Room'

const MATCHES = ['sm-cre-hex -unknown', 'sm-cre-hex -respawn']

export default {
  inject: ['map_props', 'tool_storage'],
  props: {
    rooms: Array,
  },
  emits: ['highlight'],
  computed: {
    items() {
      const items = this.missing_items.slice()
      if (this.$store.route.zone && items.length) {
        items.unshift({ text: 'Highlght', click: this.highlight })
      }
      return items
    },
    missing_items() {
      const { rooms } = this.map_props
      let items = rooms.map((room) => {
        const block_map = Room.getBlocks(room)
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
        const zones = this.$store.route.zones.filter((z) => count_by_zone[z.id])
        return zones.map((zone) => ({
          text: `${count_by_zone[zone.id]} - ${zone.name}`,
          to: { params: { zone_slug: zone.slug } },
        }))
      }
      return items.map(({ room, count, id }) => ({
        id,
        count,
        text: `${count} #${room.id} ${room.name || room.data.zone.bounds}`,
        click: () => this.$store.local.save({ editing_room: room.id }),
      }))
    },
  },
  watch: {
    items: {
      handler() {
        this.tool_storage.state.cre_items = this.items
      },
      immediate: true,
    },
  },
  methods: {
    highlight() {
      this.$emit(
        'highlight',
        this.items.map((i) => i.id),
      )
    },
  },
}
</script>
