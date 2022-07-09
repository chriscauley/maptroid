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
      <template v-if="zone_links">
        <span>/</span>
        <unrest-dropdown :items="zone_links">
          <div class="link">{{ zone?.name || 'Overworld' }}</div>
        </unrest-dropdown>
      </template>
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
      if (!this.$auth.user?.is_super_user) {
        return null
      }
      const { world_slug, zone_slug } = this.$route.params
      if (zone_slug === undefined) {
        return null
      }
      const { name } = this.$route
      const links = this.$store.route.zones
        .filter((z) => !z.data.hidden)
        .map((zone) => ({
          text: zone.name,
          to: { name, params: { world_slug, zone_slug: zone.slug } },
        }))
      return [{ text: 'Overworld', to: { name, params: { world_slug } } }, ...links]
    },
    world_links() {
      let worlds = this.$store.route.worlds
      if (!this.$auth.user?.is_superuser) {
        worlds = worlds.filter((w) => !w.hidden)
      }
      const { name } = this.$route
      return worlds.map((world) => ({
        text: `${world.name} ${world.hidden ? '(hidden)' : ''}`,
        to: { name, params: { world_slug: world.slug } },
      }))
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
