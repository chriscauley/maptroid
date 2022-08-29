<template>
  <unrest-popper placement="bottom" :watchme="osd_store.state.zoom">
    <div class="item-popper">
      <div class="item-popper__name">{{ item.attrs.title }}</div>
      <a
        v-if="$auth.user?.is_superuser"
        :href="`/djadmin/maptroid/item/${item.id}/`"
        class="link"
        @click.stop
      >
        Item Admin
      </a>
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
