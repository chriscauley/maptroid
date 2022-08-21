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
    <div class="flex-grow" />
    <unrest-dropdown v-if="superuser_links" :items="superuser_links">
      <div class="btn -link">Admin</div>
    </unrest-dropdown>
    <div class="app-nav__right">
      <router-link to="/contact/" class="btn -secondary">
        <i class="fa fa-envelope" />
        Contact
      </router-link>
      <a href="https://github.com/chriscauley/maptroid/" _target="blank" class="btn -secondary">
        <i class="fa fa-github" />
        Code
      </a>
      <kofi-button uid="E1E81MER9" text="Donate" title="Support Me on Ko-fi" />
    </div>
  </div>
</template>

<script>
import { sortBy } from 'lodash'
import KofiButton from './vue-kofi'

export default {
  components: { KofiButton },
  computed: {
    home_links() {
      const links = [
        { text: 'Select Map', to: '/' },
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
      const { world_slug, zone_slug } = this.$route.params
      if (!this.$auth.user?.is_superuser || this.$store.route.isDread()) {
        return null
      }
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
      worlds = sortBy(worlds, 'name')
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
    superuser_links() {
      if (!this.$auth.user?.is_superuser) {
        return null
      }
      const {world_slug='super-metroid'} =  this.$route.params
      return [
        { to: `/staff/assign-sprite/`, text: 'Assign Sprite' },
        { to: `/staff/smilesprite/`, text: 'Smile Sprite (old)' },
        { to: `/staff/assign-zone/${world_slug}`, text: "Assign Zone" },
        { to: `/staff/assign-room-event/${world_slug}`, text: "Room Events" },
      ]
    }
  },
}
</script>
