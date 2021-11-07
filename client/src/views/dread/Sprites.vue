<template>
  <div>
    <div v-for="(items, type_name) in type_map" :key="type_name">
      <h2>{{ type_name }}</h2>
      <i v-for="item in items" :key="item" :class="getClass(item)" />
    </div>
  </div>
</template>

<script>
import DreadItems from '@/models/DreadItems'

export default {
  __route: {
    path: '/dread/sprites/',
  },
  data() {
    DreadItems.makeCss()
    const { type_map, getClass } = DreadItems
    return { type_map, getClass }
  },
}
</script>
