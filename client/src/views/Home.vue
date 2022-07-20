<template>
  <div class="app__home">
    <router-link
      v-for="world in $store.route.worlds"
      :key="world.id"
      class="world-card"
      :to="`/sm/${world.slug}/`"
    >
      <div class="world-card__map" :style="bg(world)" />
      {{ world.slug }}
    </router-link>
  </div>
</template>

<script>
export default {
  __route: {
    path: '/',
  },
  methods: {
    bg(world) {
      return `background-image: url(/media/world_maps/${world.slug}.png)`
    },
  },
}
</script>
