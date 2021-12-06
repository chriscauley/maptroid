<template>
  <div v-if="world" class="app-sm-assign">
    <div class="app-sm-assign__zones">
      <div v-for="zone in zones" :key="zone.id" class="btn -primary" @click="setRoomZone(zone.id)">
        {{ zone.name }}
      </div>
      <div class="btn -primary" @click="setRoomZone(null)">
        No Zone
      </div>
    </div>
    <div v-if="zones">
      {{ rooms?.length }} remaining
      <div v-for="room in rooms.slice(0, 64)" :key="room.id" class="app-sm-assign__image">
        <img :src="getLayerImage(room)" />
        <div class="app-sm-assign__image-bar">
          <input type="checkbox" v-model="selected[room.id]" />
          {{ room.key }}
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
    async setRoomZone(zone_id) {
      await Promise.all(
        this.rooms
          .filter((r) => this.selected[r.id])
          .map((r) => {
            r.zone = zone_id
            this.$store.room2.save(r)
          }),
      )
      this.$store.room2.getPage(this.world_query) // refetches rooms
      this.selected = {}
    },
  },
}
</script>
