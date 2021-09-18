<template>
  <div class="list-group editor-warnings">
    <div v-for="item in misplaced_items" :key="item.id" class="list-group-item">
      <div>#{{ item.id }}: {{ item.type }}</div>
      <i class="fa fa-search" @click="gotoItem(item)" />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    items: Array,
    gotoItem: Function,
    gotoRoom: Function,
  },
  computed: {
    misplaced_items() {
      return this.items.filter((i) => {
        return (
          i.screen_xy[0] > 15 || i.screen_xy[0] < 0 || i.screen_xy[1] > 15 || i.screen_xy[1] < 0
        )
      })
    },
  },
}
</script>
