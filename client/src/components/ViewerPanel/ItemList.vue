<template>
  <div class="list-group">
    <template v-for="item in items" :key="item.id">
      <div class="list-group-item" @click="selectItem(item)">
        <i :class="item.attrs.class" />
        <div class="flex-grow truncate">
          {{ item.attrs.title }}
          <div v-if="item.data.reward">Reward: {{ item.data.reward }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  inject: ['map_props', 'osd_store'],
  props: {
    items: Object,
  },
  methods: {
    selectItem(item) {
      this.osd_store.gotoItem(item, this.map_props)
    },
  },
}
</script>
