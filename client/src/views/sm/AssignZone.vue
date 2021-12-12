<template>
  <div v-if="world" class="app-sm-assign">
    <div class="btn-group">
      <router-link
        v-for="zone in prepped_zones"
        :key="zone.id"
        :to="zone.to"
        :class="zone.class(zone.slug, $route.params.zone_slug)"
      >
        {{ zone.name }}
      </router-link>
    </div>
    <div v-if="zones">
      {{ rooms?.length }} remaining
      <div v-for="room in rooms.slice(0, 64)" :key="room.id" class="app-sm-assign__image">
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
              {{ zone.name }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  __route: {
    path: '/sm-assign/:world_slug/:zone_slug?',
  },
  data() {
    return { selected: {} }
  },
  computed: {
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
      return this.$store.world2.getFromRoute(this.$route).current
    },
    world_query() {
      return { query: { world: this.world.id, per_page: 5000 } }
    },
    zones() {
      return this.$store.zone.getPage(this.world_query)?.items
    },
    rooms() {
      const zone_id = this.zones.find((z) => z.slug === this.$route.params.zone_slug)?.id
      const rooms = this.$store.room2.getPage(this.world_query)?.items || []
      if (zone_id) {
        return rooms.filter((i) => i.zone === zone_id)
      }
      return rooms.filter((i) => !i.zone).reverse()
    },
  },
  methods: {
    getLayerImage(room) {
      const { sm_layer } = this.$store.local.state
      return `/media/smile_exports/${this.world.slug}/${sm_layer}/${room.key}`
    },
    setRoomZone(room, zone_id) {
      room.zone = zone_id
      this.$store.room2.save(room).then(() => {
        this.$store.room2.getPage(this.world_query) // refetches rooms
        this.selected = {}
      })
    },
  },
}
</script>
