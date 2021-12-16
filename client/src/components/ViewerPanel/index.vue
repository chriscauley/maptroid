<template>
  <div v-if="collapsed" class="unrest-floating-actions item-list">
    <div class="list-group-item" @click="collapsed = false">
      <i class="fas fa-chevron-up cursor-pointer" />
    </div>
  </div>
  <div v-else class="osd-panel item-list">
    <div class="osd-panel__inner">
      <div class="item-list__header">
        {{ title }}
        <div class="flex-grow" />
        <i class="fas fa-times cursor-pointer" @click="collapsed = true" />
      </div>
      <run-list v-if="tool === 'run_path'" />
      <item-list v-else :items="items" />
    </div>
  </div>
</template>

<script>
// import { sortBy } from 'lodash'
import ItemList from './ItemList.vue'
import RunList from './RunList.vue'

export default {
  components: { ItemList, RunList },
  props: {
    items: Object,
    tool: String,
  },
  computed: {
    collapsed: {
      get() {
        return this.$store.local.state.item_list_collapsed
      },
      set(value) {
        this.$store.local.save({ item_list_collapsed: value })
      },
    },
    title() {
      return 'Items and Bosses'
    },
  },
}
</script>
