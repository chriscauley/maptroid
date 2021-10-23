<template>
  <header :class="css.nav.outer()">
    <section :class="css.nav.section('left')">
      <router-link to="/" :class="css.nav.brand()">{{ title }}</router-link>
    </section>
    <section id="nav-breadcrumbs" class="unrest-breadcrumbs" />
    <section class="unrest-grid" v-if="world">
      <router-link v-for="[link, name] in world_links" :key="link" :to="link" class="link">
        {{ name }}
      </router-link>
    </section>
    <div class="flex-grow" />
    <section class="unrest-grid">
      <unrest-dropdown class="btn -light" :items="items">
        <i class="fa fa-bars" />
      </unrest-dropdown>
    </section>
  </header>
</template>

<script>
import css from '@unrest/css'
export default {
  data() {
    const items = [
      { to: '/', text: 'Interactive Map' },
      { class: 'divider' },
      { to: '/editor/', text: 'Editor' },
      { to: '/spritegallery/', text: 'Item Gallery' },
    ]
    return { css, items }
  },
  computed: {
    world_links() {
      const { world_id } = this.$route.params
      return [
        [`/admin/main/world/${world_id}/`, 'Admin'],
        [`/viewer/${world_id}/`, 'Viewer'],
        [`/editor/${world_id}/`, 'Editor'],
      ]
    },
    world() {
      const { world_id } = this.$route.params
      return world_id && this.$store.world.getOne(world_id)
    },
    title() {
      return this.world?.name || 'Project Maptroid'
    },
  },
}
</script>
