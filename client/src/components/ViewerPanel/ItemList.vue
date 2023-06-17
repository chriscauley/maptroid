<template>
  <div class="list-group">
    <div class="list-group-item item-list__filter">
      Filter:
      <unrest-form v-if="schema" :schema="schema" :state="osd_store.state.filters">
        <template #actions>{{ ' ' }}</template>
      </unrest-form>
    </div>
    <template v-for="item in filtered_items" :key="item.id">
      <div class="list-group-item" @click="selectItem(item)">
        <div>
          <i :class="item.attrs.class" />
        </div>
        <div class="flex-grow truncate">
          {{ item.attrs.title }}
          <div v-if="item.data.reward">Reward: {{ item.data.reward }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { startCase, uniq } from 'lodash'

export default {
  inject: ['map_props', 'osd_store'],
  props: {
    items: Object,
  },
  computed: {
    filtered_items() {
      const { item_type } = this.osd_store.state.filters
      if (item_type) {
        return this.items.filter((i) => i.data.type === item_type)
      }
      return this.items
    },
    schema() {
      if (!this.items.length) {
        return null
      }
      const item_types = uniq(this.items.map((i) => i.data.type)).sort()
      return {
        type: 'object',
        properties: {
          item_type: {
            type: 'string',
            title: null,
            enum: item_types,
            enumNames: item_types.map(startCase),
            placeholder: 'All Items',
          },
        },
      }
    },
  },
  methods: {
    selectItem(item) {
      this.osd_store.gotoItem(item, this.map_props)
    },
  },
}
</script>
