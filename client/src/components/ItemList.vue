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
      <div class="list-group">
        <template v-for="item in items" :key="item.id">
          <div class="list-group-item" @click="$emit('select-item', item)">
            <i :class="item.class" />
            <div class="flex-grow truncate">
              {{ item.title }}
              <div v-if="item.data.reward">Reward: {{ item.data.reward }}</div>
            </div>
            <div
              v-for="time in item.times_by_video_id?.[video.id]"
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
// import { sortBy } from 'lodash'

export default {
  inject: ['video'],
  props: {
    items: Object,
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
    // TODO dread was loading zone_items instead. Need to update dread to do this in parent component
    // import DreadItems from '@/models/DreadItems'
    // items() {
    //   const allowed_types = {}
    //   DreadItems.items.forEach((type) => (allowed_types[type] = true))
    //   return sortBy(
    //     this.zone_items.filter((i) => allowed_types[i.data.type]),
    //     (i) => (i.video_times || [{ seconds: Infinity }])[0].seconds,
    //   )
    // },
  },
}
</script>
