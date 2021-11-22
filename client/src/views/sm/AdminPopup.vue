<template>
  <unrest-admin-popup class="-right">
    <template #buttons>
      <unrest-dropdown :items="layer_items">
        <div class="btn btn-primary">
          <i class="fa fa-layer" /> {{ $store.local.state.sm_layer }}
        </div>
      </unrest-dropdown>
      <overlap-fixer v-if="rooms" :rooms="rooms" />
    </template>
  </unrest-admin-popup>
</template>

<script>
import OverlapFixer from './OverlapFixer'

export default {
  components: { OverlapFixer },
  props: {
    rooms: Array,
  },
  computed: {
    layer_items() {
      return ['layer-1', 'layer-2', 'bts', 'plm-enemies'].map((layer) => ({
        text: layer,
        click: () => this.$store.local.save({ sm_layer: layer }),
      }))
    },
  },
}
</script>
