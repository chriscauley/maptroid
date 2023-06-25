<template>
  <div v-if="collapsed" class="unrest-floating-actions item-list">
    <div class="list-group-item" @click="collapsed = false">
      <div v-if="filtered_item_type">Filter: {{ filtered_item_type }}</div>
      <i class="fa fa-chevron-up" />
    </div>
  </div>
  <div v-else class="osd-panel item-list">
    <div class="osd-panel__inner">
      <div class="item-list__header" @click="collapsed = true">
        {{ title }}
        <div class="flex-grow" />
        <i class="fa fa-times" />
      </div>
      <inventory />
      <run-list v-if="tool === 'run_path'" />
      <location-list v-else-if="tool === 'randomizer'" :items="items" />
      <item-list v-else :items="items" />
    </div>
  </div>
</template>

<script>
import { startCase } from 'lodash'

import ItemList from './ItemList.vue'
import Inventory from '../Inventory'
import LocationList from './LocationList.vue'
import RunList from './RunList.vue'

export default {
  components: { ItemList, Inventory, LocationList, RunList },
  inject: ['osd_store'],
  props: {
    items: Object,
    tool: String,
  },
  computed: {
    filtered_item_type() {
      return startCase(this.osd_store.state.filters.item_type || '')
    },
    collapsed: {
      get() {
        return this.$store.local.state.item_list_collapsed
      },
      set(value) {
        this.$store.local.save({ item_list_collapsed: value })
      },
    },
    title() {
      const is_dread = this.$route.params.world_slug?.endsWith('dread')
      return is_dread ? 'Items and Bosses' : 'Items'
    },
  },
}
</script>
