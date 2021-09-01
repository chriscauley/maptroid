<template>
  <div v-bind="item_attrs">
    <div v-if="target_number !== undefined" class="target_number">{{ target_number }}</div>
  </div>
</template>

<script>
import Item from '@/models/Item'
import scale from '@/lib/scale'

export default {
  props: {
    item: Object,
    world: Object,
    target_number: Number,
  },
  computed: {
    item_attrs() {
      const { item, world } = this
      const { id, type, class: _class } = item
      const { x, y, width, height } = Item.getMapBounds(item, world)
      const { size } = this.$store.viewer.state
      return {
        id: `overlay-item-${id}`,
        class: `html-overlay__item -class-${_class} sm-${_class} -${type}`,
        style: scale.html({ x, y, width, height }, 1, size),
      }
    },
  },
}
</script>
