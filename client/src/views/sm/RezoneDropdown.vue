<template>
  <unrest-dropdown class="btn -warning" v-if="$store.route.zone" :items="items">
    <i class="fa fa-arrows-h" />
    {{ text }}
  </unrest-dropdown>
</template>

<script>
export default {
  props: {
    storage: Object,
  },
  computed: {
    items() {
      return this.$store.route.zones.map((zone) => ({
        text: zone.name,
        click: () =>
          this.storage.save({
            selected: { tool: 'rezone', variant: zone.id },
          }),
      }))
    },
    text() {
      const { tool, variant } = this.storage.state.selected
      if (tool === 'rezone') {
        return this.$store.route.zones.find((z) => z.id === variant).name
      }
      return ''
    },
  },
}
</script>
