<template>
  <div :key="screenshot.id" class="panel-screenshot">
    <img :src="screenshot.output" />
    <div class="panel-screenshot__buttons">
      #{{ screenshot.id }}
      <template v-if="screenshot.zone">
        <span>{{ screenshot.data.zone_xy }}</span>
      </template>
      <select v-model="screenshot.zone">
        <option value="">No zone</option>
        <option v-for="zone in zones" :key="zone" :value="zone.id">{{ zone.name }}</option>
      </select>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    screenshot: Object,
  },
  computed: {
    zones() {
      return this.$store.zone.getPage({ per_page: 100 })?.items || []
    },
  },
}
</script>
