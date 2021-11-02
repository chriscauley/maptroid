<template>
  <div class="app-body">
    <div class="ur-wrapper">
      <div v-if="zone" class="ur-inner">
        <h1>{{ zone.name }}</h1>
        <ul>
          <li>Screenshots: {{ screenshots.length }}</li>
        </ul>
      </div>
    </div>
    <div class="app-panel">
      <unrest-dropdown :items="zone_links">
        <div class="link">
          {{ zone?.name || 'Select a Zone' }}
        </div>
      </unrest-dropdown>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
const WORLD = 3 // hardcoded to dread

export default {
  __route: {
    path: '/process-dread/:zone_id?/:zone_slug?/',
  },
  data() {
    return { zone_id: parseInt(this.$route.params.zone_id) }
  },
  computed: {
    zones() {
      const q = { query: { per_page: 5000, world: WORLD } }
      return this.$store.zone.getPage(q)?.items
    },
    zone() {
      const { zone_id } = this
      return zone_id && this.zones?.find((z) => z.id === zone_id)
    },
    zone_links() {
      return this.zones?.map((zone) => ({
        text: zone.name,
        to: `/process-dread/${zone.id}/${zone.slug}/`,
      }))
    },
    screenshots() {
      const { zone_id } = this.$route.params
      const q = { query: { per_page: 5000, world: WORLD, zone: zone_id } }
      return this.$store.screenshot.getPage(q)?.items || []
    },
  },
  mounted() {
    this.refresh()
  },
  methods: {
    refresh() {
      axios.get(`/api/process-zone/${WORLD}/${this.zone_id}/`).then((data) => {
        console.warn(data)
      })
    },
  },
}
</script>
