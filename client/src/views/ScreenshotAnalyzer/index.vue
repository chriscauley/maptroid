<template>
  <div class="app-body">
    <div class="ur-wrapper">
      <div v-if="screenshot" class="ur-inner">
        <div class="grid__16-5">
          <img class="max-w-unset" :src="screenshot.output" />
        </div>
      </div>
    </div>
    <div class="app-panel"></div>
    <breadcrumbs
      :zone="zone"
      :zones="zones"
      :screenshot="screenshot"
      :zone_screenshots="zone_screenshots"
    />
  </div>
</template>

<script>
import Breadcrumbs from './Breadcrumbs.vue'
const WORLD = 3 // TODO world hardcoded as dread

export default {
  __route: {
    path: '/screenshot/analyzer/:zone_id?/:screenshot_id?/',
  },
  components: { Breadcrumbs },
  computed: {
    zones() {
      const q = { query: { per_page: 5000, world: WORLD } }
      return this.$store.zone.getPage(q)?.items.map((zone) => ({
        ...zone,
        to: `/screenshot/analyzer/${zone.id}/`,
        text: zone.name,
      }))
    },
    zone_id() {
      return parseInt(this.$route.params.zone_id)
    },
    zone() {
      return this.zones?.find((z) => z.id === this.zone_id)
    },
    zone_screenshots() {
      if (!this.zone_id) {
        return
      }
      const q = { query: { per_page: 5000, world: WORLD, zone: this.zone_id } }
      return this.$store.screenshot.getPage(q)?.items.map((screenshot) => ({
        text: screenshot.id,
        to: `/screenshot/analyzer/${this.zone_id}/${screenshot.id}/`,
        ...screenshot,
      }))
    },
    screenshot() {
      const screenshot_id = parseInt(this.$route.params.screenshot_id)
      return this.zone_screenshots?.find((s) => s.id === screenshot_id)
    },
  },
}
</script>
