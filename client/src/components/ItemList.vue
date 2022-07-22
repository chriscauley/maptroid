<template>
  <div v-if="collapsed" class="unrest-floating-actions item-list">
    <div class="list-group-item">
      <i class="fa fa-chevron-up" />
    </div>
  </div>
  <div v-else class="osd-panel item-list">
    <div class="osd-panel__inner">
      <div class="item-list__header" @click="collapsed = false">
        {{ title }}
        <div class="flex-grow" />
        <i class="fa fa-close cursor-pointer" @click="collapsed = true" />
      </div>
      <div class="list-group">
        <template v-for="item in items" :key="item.id">
          <div class="list-group-item" @click.stop="$emit('select-item', item)">
            <i :class="item.class" />
            <div class="flex-grow truncate">
              {{ item.title }}
              <div v-if="item.data.duplicate">(duplicate)</div>
              <div v-if="item.data.reward">Reward: {{ item.data.reward }}</div>
            </div>
            <div
              v-for="time in $store.route.times_by_item_id[item.id]"
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
export default {
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
  },
}
</script>
