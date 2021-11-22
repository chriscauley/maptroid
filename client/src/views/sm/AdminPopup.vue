<template>
  <unrest-admin-popup class="-right">
    <template #buttons>
      <unrest-dropdown :items="layer_items">
        <div class="btn btn-primary">
          <i class="fa fa-layer" /> {{ $store.local.state.sm_layer }}
        </div>
      </unrest-dropdown>
    </template>
  </unrest-admin-popup>
</template>

<script>
export default {
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
