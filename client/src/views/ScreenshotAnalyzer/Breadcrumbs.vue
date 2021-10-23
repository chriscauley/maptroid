<template>
  <teleport to="#nav-breadcrumbs">
    /
    <span>Screenshot Analyzer</span>
    /
    <unrest-dropdown :items="zones">
      <div class="link">
        {{ zone?.name || 'Zone?' }}
      </div>
    </unrest-dropdown>
    <template v-if="zone">
      /
      <unrest-dropdown :items="zone_screenshots">
        <div class="link">{{ screenshot?.id || 'Screenshot ?' }}</div>
      </unrest-dropdown>
    </template>
  </teleport>
</template>

<script>
export default {
  props: {
    zone: Object,
    zones: Array,
    screenshot: Object,
    zone_screenshots: Array,
  },
}
</script>
