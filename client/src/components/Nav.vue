<template>
  <unrest-dropdown class="floating-nav">
    <div class="floating-nav__title link">{{ title }}</div>
    <template #content>
      <div class="dropdown-items">
        <router-link class="dropdown-item" to="/dread/">
          Metroid Dread
        </router-link>
        <router-link v-for="link in zone_links" :key="link.to" class="dropdown-item" :to="link.to">
          - {{ link.text }}
        </router-link>
        <router-link class="dropdown-item" to="/downloads/">
          Download Maps + Icons
        </router-link>
        <router-link class="dropdown-item" to="/about/">
          About
        </router-link>
        <router-link class="dropdown-item" to="/contact/">
          Contact
        </router-link>
        <template v-if="$auth.user?.is_superuser">
          <router-link class="dropdown-item" to="/dread-sprites/">Sprites</router-link>
          <router-link class="dropdown-item" to="/screenshotupload/"
            >Upload Screenshots</router-link
          >
        </template>
      </div>
    </template>
  </unrest-dropdown>
</template>

<script>
const WORLD = 3

export default {
  computed: {
    zones() {
      const q = { query: { world_id: WORLD, per_page: 5000 } }
      return this.$store.zone.getPage(q)?.items || []
    },
    zone_links() {
      return this.zones
        .filter((z) => !z.data.hidden)
        .map((zone) => ({
          text: zone.name,
          to: `/dread/${zone.slug}/`,
        }))
    },
    title() {
      const zone = this.zones.find((z) => z.slug === this.$route.params.zone_slug)
      if (zone) {
        return `Maptroid: ${zone.name}`
      }
      if (this.$route.fullPath.startsWith('/dread')) {
        return 'Maptroid: Dread'
      }
      return 'Project Maptroid'
    },
  },
}
</script>
