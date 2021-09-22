<template>
  <div v-bind="item_attrs">
    <i v-if="icon" :class="icon" />
    <div v-else-if="target_number" class="html-overlay__target-number">{{ target_number }}</div>
  </div>
</template>

<script>
import Item from '@/models/Item'
import scale from '@/lib/scale'

export default {
  props: {
    item: Object,
    world: Object,
    game: Object,
    target_number: Number,
  },
  computed: {
    icon() {
      if (this.game?.state.items[this.item.id]) {
        return 'html-overlay__target-number fa fa-check'
      } else if (this.game?.state.missing[this.item.id]) {
        return 'html-overlay__target-number fa fa-close'
      }
      return undefined
    },
    item_attrs() {
      const { selected_item } = this.$store.viewer.state
      const { item, world } = this
      const { id, type, class: _class } = item
      const { x, y, width, height } = Item.getMapBounds(item, world)
      const size = this.$store.osd.state.content_width
      return {
        id: `overlay-item-${id}`,
        class: [
          `html-overlay__item -class-${_class} sm-${_class} -${type}`,
          { '-selected': selected_item === item.id },
        ],
        style: scale.html({ x, y, width, height }, 1, size),
      }
    },
  },
}
</script>
