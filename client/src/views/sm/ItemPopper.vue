<template>
  <unrest-popper placement="bottom" :watchme="osd_store.state.zoom">
    <div class="item-popper">
      <div class="item-popper__name">{{ item.title }}</div>
    </div>
  </unrest-popper>
</template>

<script>
import prepItem from './prepItem'

export default {
  inject: ['osd_store'],
  computed: {
    item() {
      const { selected_item_id } = this.osd_store.state
      return prepItem(this.$store.route.world_items.find((i) => i.id === selected_item_id))
    },
  },
}
</script>
