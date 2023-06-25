<template>
  <div class="list-group location-list">
    <div class="list-group-item item-list__filter">
      <unrest-form v-if="schema" :schema="schema" :state="osd_store.state.filters">
        <template #actions>{{ ' ' }}</template>
      </unrest-form>
      <button class="btn -danger" @click="reset">Reset</button>
    </div>
    <div v-for="group in groups" :key="group.name" class="location-list__group">
      <div class="location-list__group-name">
        <i :class="group.icon" />
        {{ group.name }}
      </div>
      <div v-for="item in group.items" :key="item.id">
        <div class="location-list__group-item">
          <div class="_cb">
            <i :class="getCheckbox(item)" @click="() => toggleLocation(item)" />
          </div>
          <div class="flex-grow truncate">
            {{ item.attrs.title }}
          </div>
          <div>
            <i class="fa fa-search" @click="selectItem(item)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { startCase, uniq, sortBy } from 'lodash'

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
    item_by_location_name() {
      const out = {}
      this.items.forEach((i) => (out[i.data.location_name] = i))
      return out
    },
    groups() {
      const group_by_slug = {}
      this.$store.tracker.listLocationNames().forEach((name) => {
        const item = this.item_by_location_name[name]
        if (!item) {
          return
        }
        const key_used = this.$store.tracker.getKeyUsed(item)
        if (!group_by_slug[key_used]) {
          group_by_slug[key_used] = {
            slug: key_used,
            name: this.$store.tracker.getKeyName(key_used),
            icon: this.$store.tracker.getKeyIcon(key_used),
            items: [],
          }
        }
        group_by_slug[key_used].items.push(item)
      })

      const groups = Object.values(group_by_slug)
      const _sort = (group) => {
        if (!group.slug) {
          return Infinity
        }
        if (group.slug === 'sequence-break') {
          return -1
        }
        return groups.indexOf(group)
      }
      return sortBy(groups, _sort)
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
  mounted() {
    this.$store.tracker.update()
  },
  methods: {
    selectItem(item) {
      this.osd_store.gotoItem(item, this.map_props)
    },
    getCheckbox(item) {
      const checked = this.$store.tracker.isLocationCompleted(item)
      return `fa fa-lg fa-${checked ? 'check-' : ''}square-o`
    },
    toggleLocation(item) {
      this.$store.tracker.toggleLocation(item.id)
    },
    reset() {
      this.$ui.alert({
        text: 'Are you sure you want to reset all locations and items? This cannot be undone.',
        actions: [
          {
            click: () => this.$ui.alert(null),
            class: 'btn -text',
            text: 'Cancel',
          },
          {
            click: () => {
              this.$ui.alert(null)
              this.$store.tracker.reset()
            },
            class: 'btn -danger',
            text: 'Reset Tracker',
          },
        ],
      })
    },
  },
}
</script>
