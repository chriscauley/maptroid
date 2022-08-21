<template>
  <div class="mc-data">
    <template v-if="mc_data">
      <div>Genre: {{ mc_data.genre }}</div>
      <div>Difficulty: {{ mc_data.difficulty }}</div>
      <div class="mc-data__runtime">
        Length: {{ mc_data.runtime }}
      </div>
    </template>
    <div v-if="world.data.metrics">Screens: {{ world.data.metrics.screens }}</div>
  </div>
</template>

<script>
export default {
  props: {
    world: Object,
  },
  computed: {
    mc_data() {
      return this.world.data.mc_data
    },
  },
}
</script>
