<template>
  <div v-if="collapsed" class="unrest-floating-actions item-list">
    <div class="list-group-item" @click="collapsed = false">
      <i class="fa fa-chevron-up cursor-pointer" />
    </div>
  </div>
  <div v-else class="osd-panel item-list">
    <div class="osd-panel__inner">
      <div class="item-list__header">
        Items and Bosses
        <div class="flex-grow" />
        <i class="fa fa-close cursor-pointer" @click="collapsed = true" />
      </div>
      <div class="scroll-me list-group">
        <template v-for="item in items" :key="item.id">
          <div class="list-group-item" @click="$emit('select-item', item)">
            <i :class="item.icon" />
            <span class="flex-grow truncate">{{ item.name }}</span>
            <div
              v-for="time in item.times_by_video_id[$route.query.video]"
              :key="time.seconds"
              class="pill -primary"
            >
              {{ time.hms }}
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { sortBy } from 'lodash'

import DreadItems from '@/models/DreadItems'

export default {
  props: {
    zone_items: Object,
    playthrough: Object,
  },
  emits: ['select-item'],
  computed: {
    collapsed: {
      get() {
        return this.$store.local.state.item_list_collapsed
      },
      set(value) {
        this.$store.local.save({ item_list_collapsed: value })
      },
    },
    items() {
      const allowed_types = {}
      DreadItems.items.forEach((type) => (allowed_types[type] = true))
      return sortBy(
        this.zone_items.filter((i) => allowed_types[i.data.type]),
        (i) => (i.video_times || [{ seconds: Infinity }])[0].seconds,
      )
    },
  },
}
</script>
