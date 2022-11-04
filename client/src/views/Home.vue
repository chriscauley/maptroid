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
        <div class="world-card__details">
          <div>
            <div class="world-card__title">{{ world.name }}</div>
            <div v-if="getAuthor(world)" class="world-card__author">
              by {{ getAuthor(world) }}
            </div>
          </div>
          <mc-data :world="world" />
        </div>
      </router-link>
    </div>
  </div>
</template>

<script>
import { sortBy } from 'lodash'
import { markRaw } from 'vue'
import FancySelect from '@/components/FancySelect'

import McData from '@/components/McData.vue'

const difficulties = ['Beginner', 'Vanilla', 'Veteran', 'Expert', 'Unknown']
const sort_choices = ['Name', 'Runtime', 'Screens']

const getDifficultyChoices = (worlds) => {
  const counts = {}
  worlds = worlds.filter((w) => !w.hidden)
  worlds.forEach((world) => {
    const difficulty = world.data.mc_data?.difficulty || 'Unknown'
    counts[difficulty] = (counts[difficulty] || 0) + 1
  })
  const choices = Object.entries(counts).map(([value, count]) => ({
    name: `${value} (${count})`,
    value,
  }))
  return sortBy(choices, (c) => difficulties.indexOf(c.value))
}

const parseRuntime = (world) => {
  const [h, m] = (world.data.mc_data?.runtime || '-1:0').split(':')
  return -(parseInt(h) * 60 + parseInt(m))
}

export default {
  __route: {
    path: '/',
  },
  components: { McData },
  data() {
    const ui = { tagName: markRaw(FancySelect) }
    return {
      schema: {
        type: 'object',
        properties: {
          search: { title: null, type: 'string', placeholder: 'Search Maps' },
          sort_by: {
            title: null,
            type: 'string',
            enum: sort_choices.map((s) => s.toLowerCase()),
            enumNames: sort_choices,
            ui,
            icon: (c) => (c === 'name' ? 'sort-alpha-asc' : 'sort-amount-desc'),
          },
          difficulty: {
            title: null,
            getChoices: () => getDifficultyChoices(this.$store.route.worlds),
            placeholder: 'Difficulty',
            ui,
            icon: 'shield',
          },
        },
      },
      state: { sort_by: 'name' },
    }
  },
  computed: {
    worlds() {
      let { worlds } = this.$store.route
      const { search, difficulty, sort_by } = this.state
      worlds = worlds.filter((w) => !w.hidden)
      if (search) {
        const _search = search.trim()
        const _ = (w) => {
          const mc_data = w.data.mc_data || {}
          const author = mc_data.author || ''
          const difficulty = mc_data.difficulty || ''
          const genre = mc_data.genre || ''
          return `${w.name} ${author} ${genre} ${difficulty}`.toLowerCase()
        }
        worlds = worlds.filter((w) => _(w).includes(_search))
      }
      if (difficulty) {
        worlds = worlds.filter((w) => {
          return (w.data.mc_data?.difficulty || 'Unknown') === difficulty
        })
      }
      let sorter = 'name'
      if (sort_by === 'difficulty') {
        sorter = (w) => difficulties.indexOf(w.data.mc_data?.difficulty)
      } else if (sort_by === 'runtime') {
        sorter = parseRuntime
      } else if (sort_by === 'screens') {
        sorter = (w) => -w.data.metrics?.screens || 1e6
      }
      worlds = sortBy(worlds, sorter)
      return worlds
    },
  },
  methods: {
    bg(world) {
      return `background-image: url(/media/world_maps/${world.slug}.png)`
    },
    getAuthor(world) {
      return world.data.mc_data?.author
    },
  },
}
</script>
