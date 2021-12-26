<template>
  <unrest-popper placement="bottom" :watchme="osd_store.state.zoom">
    <div class="item-popper">
      <div class="item-popper__name">{{ item.attrs.title }}</div>
    </div>
  </unrest-popper>
</template>

<script>
export default {
  inject: ['osd_store'],
  props: {
    item: Object,
  },
}
</script>
