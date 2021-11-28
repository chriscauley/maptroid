<template>
  <div class="app-nav">
    <unrest-dropdown :items="home_links">
      <div class="link">Project Maptroid</div>
    </unrest-dropdown>
    <template v-if="world">
      <span>/</span>
      <unrest-dropdown :items="world_links">
        <div class="link">{{ world.name }}</div>
      </unrest-dropdown>
    </template>
    <template v-if="zone">
      <span>/</span>
      <unrest-dropdown :items="zone_links">
        <div class="link">{{ zone.name }}</div>
      </unrest-dropdown>
    </template>
  </div>
</template>

<script>
export default {
  computed: {
    home_links() {
      const links = [
        ...this.world_links,
        { text: 'Download Maps + Icons', to: '/downloads/' },
        { text: 'About', to: '/about/' },
        { text: 'Contact', to: '/contact/' },
      ]
      if (this.$auth.user?.is_superuser) {
        links.push({ text: 'Sprites', to: '/dread-sprites/' })
        links.push({ text: 'Upload Screenshots', to: '/screenshotupload/' })
      }
      return links
    },
    zone_links() {
      const { world_slug } = this.$route.params
      return this.$store.route.zones
        .filter((z) => !z.data.hidden)
        .map((zone) => ({
          text: zone.name,
          to: this.$store.route.getZoneLink(world_slug, zone.slug),
        }))
    },
    world_links() {
      const worlds = this.$store.route.worlds.filter((w) => !w.hidden)
      return worlds.map((world) => {
        const to = this.$store.route.getWorldLink(world.slug)
        return { text: world.name, to }
      })
    },
    world() {
      return this.$store.route.world
    },
    zone() {
      return this.$store.route.zone
    },
    title() {
      return 'Project Maptroid'
    },
  },
}
</script>
