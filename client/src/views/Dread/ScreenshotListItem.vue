<template>
  <div :key="screenshot.id" class="panel-screenshot">
    <img :src="screenshot.src" />
    <div class="panel-screenshot__buttons">
      #{{ screenshot.id }}
      <template v-if="screenshot.zone">
        <span>{{ screenshot.data.zone_xy }}</span>
        <input type="number" style="width: 50px;" />
      </template>
      <select v-model="screenshot.zone" @input="onInput">
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
  mounted() {
    if (this.screenshot.id === 3) {
      setTimeout(() => {
        this.screenshot.zone = 1
      }, 500)
    }
    if (this.screenshot.id === 5) {
      setTimeout(() => {
        this.screenshot.zone = 1
        this.screenshot.data._world = { x: 0.1, y: 0.1, width: 1 }
      }, 1000)
    }
  },
}
</script>
