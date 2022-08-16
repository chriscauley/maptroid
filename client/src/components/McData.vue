<template>
  <div class="mc-data">
    <div v-if="world.data.metrics">
      Screens: {{ world.data.metrics.screens }}
    </div>
    <template v-if="mc_data">
      <div>Genre: {{ mc_data.genre }}</div>
      <div>Difficulty: {{ mc_data.difficulty }}</div>
      <div class="mc-data__row">
        <div class="mc-data__rating" :title="rating.title">
          <img v-for="(icon, i) in rating.icons" :key="i" :src="`/static/mc/${icon}.png`" />
          {{ rating.text }}
        </div>
        <div class="mc-data__runtime">
          {{ mc_data.runtime }}
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { range } from 'lodash'

export default {
  props: {
    world: Object
  },
  computed: {
    mc_data() {
      return this.world.data.mc_data
    },
    rating() {
      const { rating } = this.mc_data
      if (!rating) {
        return { text: 'Unrated', title: 'This map is not rated.' }
      }
      const icons = range(Math.floor(rating)).map(() => 'star')
      if (rating % 1) {
        icons.push('half_star')
      }
      range(parseInt(5 - rating)).forEach(() => icons.push('no_star'))
      return {
        icons,
        title: `This map has a rating of ${rating} on Metroid Construction`,
      }
    },
  },
}
</script>
