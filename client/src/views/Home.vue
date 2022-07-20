<template>
  <div class="app__home">
    <h2>Projcet Maptroid</h2>
    <div class="world-card__list">
      <router-link
        v-for="world in worlds"
        :key="world.id"
        class="world-card"
        :to="`/sm/${world.slug}/`"
      >
        <div class="world-card__map" :style="bg(world)" />
        {{ world.name }}
      </router-link>
    </div>
  </div>
</template>

<script>
import { sortBy } from 'lodash'

export default {
  __route: {
    path: '/',
  },
  computed: {
    worlds() {
      let { worlds } = this.$store.route
      return sortBy(worlds.filter(w => !w.hidden), 'name')
    }
  },
  methods: {
    bg(world) {
      return `background-image: url(/media/world_maps/${world.slug}.png)`
    },
  },
}
</script>
