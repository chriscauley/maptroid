<template>
  <div v-if="world" class="app-sm-assign">
    <div class="btn-group">
      <router-link
        v-for="zone in prepped_zones"
        :key="zone.id"
        :to="zone.to"
        :class="zone.class(zone.slug, $route.params.zone_slug)"
      >
        {{ zone.name.slice(0, 10) }}
      </router-link>
      <select v-model="filter_w" class="btn -primary">
        <option v-for="option in wh_options" :key="option" :value="option">w={{ option }}</option>
      </select>
      <select v-model="filter_h" class="btn -primary">
        <option v-for="option in wh_options" :key="option" :value="option">h={{ option }}</option>
      </select>
    </div>
    <div v-if="zones">
      {{ rooms?.length }} remaining
      <div v-for="room in rooms.slice(0, 100)" :key="room.id" class="app-sm-assign__image">
        <img :src="getLayerImage(room)" />
        <div class="app-sm-assign__image-bar">
          {{ room.key }}
          <div class="btn-group">
            <div
              v-for="zone in prepped_zones"
              :key="zone.name"
              :class="zone.class(room.zone, zone.id)"
              @click="setRoomZone(room, zone.id)"
            >
              {{ zone.name.slice(0, 10) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { sortBy } from 'lodash'

import Mousetrap from '@unrest/vue-mousetrap'

export default {
  mixins: [Mousetrap.Mixin],
  __route: {
    path: '/sm-assign/:world_slug/:zone_slug?',
  },
  data() {
    const wh_options = ['', 1, 2, 3, 4, 5, '>5']
    return { selected: {}, filter_w: '', filter_h: '', wh_options }
  },
  computed: {
    mousetrap() {
      const keymap = {}
      if (this.world) {
        this.zones?.forEach((zone) => {
          const key = zone.slug[0]
          if (keymap[key]) {
            keymap[key] = () => {
              throw 'Redundant keymap, rename zone'
            }
          } else {
            keymap[key] = () => this.setRoomZone(this.rooms[0], zone.id)
          }
        })
      }
      return keymap
    },
    prepped_zones() {
      const zones = this.zones?.map((z) => ({
        to: `/sm-assign/${this.world.slug}/${z.slug}/`,
        name: z.name,
        slug: z.slug,
        id: z.id,
        class: (a, b) => ['btn', a === b ? '-primary' : '-secondary'],
      }))
      zones?.push({
        to: `/sm-assign/${this.world.slug}/`,
        name: 'No Zone',
        class: (a, b) => ['btn', (a || 0) === (b || 0) ? '-primary' : '-secondary'],
      })
      return zones
    },
    world() {
      return this.$store.world.getFromRoute(this.$route).current
    },
    world_query() {
      return { query: { world: this.world.id, per_page: 5000 } }
    },
    zones() {
      return this.$store.zone.getPage(this.world_query)?.items
    },
    rooms() {
      let { filter_h, filter_w } = this
      const zone_id = this.zones.find((z) => z.slug === this.$route.params.zone_slug)?.id
      let rooms = this.$store.room.getPage(this.world_query)?.items || []
      if (zone_id) {
        rooms = rooms.filter((i) => i.zone === zone_id)
      } else {
        rooms = rooms.filter((i) => !i.zone)
      }
      if (filter_h == '>5') {
        rooms = rooms.filter((r) => r.data.zone.bounds[3] > 5)
      } else if (filter_h) {
        filter_h = parseInt(filter_h)
        rooms = rooms.filter((r) => r.data.zone.bounds[3] === filter_h)
      }
      if (filter_w == '>5') {
        rooms = rooms.filter((r) => r.data.zone.bounds[2] > 5)
      } else if (filter_w) {
        filter_w = parseInt(filter_w)
        rooms = rooms.filter((r) => r.data.zone.bounds[2] === filter_w)
      }
      return sortBy(rooms, 'key')
    },
  },
  methods: {
    getLayerImage(room) {
      const { sm_layer } = this.$store.local.state
      return `/media/smile_exports/${this.world.slug}/${sm_layer}/${room.key}`
    },
    setRoomZone(room, zone_id) {
      room.zone = zone_id
      this.$store.room.save(room).then(() => {
        this.$store.room.getPage(this.world_query) // refetches rooms
        this.selected = {}
      })
    },
  },
}
</script>
