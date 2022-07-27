<template>
  <div class="app__home">
    <h1>
      Project Maptroid
      <router-link to="/app/faq/" class="link">
        What is this?
      </router-link>
    </h1>
    <unrest-form :schema="schema" :state="state">
      <template #actions>{{ ' ' }}</template>
    </unrest-form>
    <div class="world-card__list">
      <router-link
        v-for="world in worlds"
        :key="world.id"
        class="world-card"
        :to="`/maps/${world.slug}/`"
      >
        <div class="world-card__map" :style="bg(world)" />
        {{ world.name }}
        <div v-if="world.data.mc_data?.author">by {{ world.data.mc_data?.author }}</div>
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
  data() {
    return {
      schema: {
        type: 'object',
        properties: {
          search: { title: null, type: 'string', placeholder: 'Search Maps' },
        },
      },
      state: {},
    }
  },
  computed: {
    worlds() {
      let { worlds } = this.$store.route
      worlds = worlds.filter((w) => !w.hidden)
      worlds = sortBy(worlds, 'name')
      if (this.state.search) {
        const search = this.state.search.trim()
        const _ = (w) => `${w.name} ${w.data.mc_data?.author || ''}`.toLowerCase()
        worlds = worlds.filter((w) => _(w).includes(search))
      }
      return worlds
    },
  },
  methods: {
    bg(world) {
      return `background-image: url(/media/world_maps/${world.slug}.png)`
    },
  },
}
</script>
