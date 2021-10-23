<template>
  <div>
    <h2>Dread Editor</h2>
    <div v-for="zone in dread_zones" :key="zone.id">
      <router-link :to="`/dread/${zone.id}/${zone.slug}/`">
        {{ zone.name }}
      </router-link>
    </div>
    <h2>Misc</h2>
    <div v-for="link in links" :key="link">
      <router-link :to="link">{{ link }}</router-link>
    </div>
  </div>
</template>

<script>
export default {
  __route: {
    path: '/',
  },
  computed: {
    dread_zones() {
      return this.$store.zone.getPage({ query: { world: 3 } })?.items || []
    },
    links() {
      return ['/screenshot/analyzer']
    },
  },
}
</script>
