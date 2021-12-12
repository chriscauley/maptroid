<template>
  <div class="list-group">
    <template v-for="item in items" :key="item.id">
      <div class="list-group-item" @click="selectItem(item)">
        <i :class="item.class" />
        <div class="flex-grow truncate">
          {{ item.title }}
          <div v-if="item.data.reward">Reward: {{ item.data.reward }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  props: {
    items: Object,
  },
  methods: {
    selectItem(item) {
      console.log('TODO')
    },
  },
}
</script>
