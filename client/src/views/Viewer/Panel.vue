<template>
  <div class="osd-panel -viewer">
    <div class="osd-panel__title">Room #{{ room.id }} - {{ room.name || 'unknown' }}</div>
    <div class="osd-panel__items list-group">
      <div v-for="(item, i) in items" :key="item.id" class="osd-panel__item list-group-item">
        <div class="osd-panel__item-number">{{ i + 1 }}</div>
        <div :class="css.item(item)" />
        <div class="flex-grow">{{ item.type }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    items: Array,
    room: Object,
  },
  computed: {
    css() {
      return {
        item: (item) => {
          if (item.class === 'boss') {
            return 'sm-map -boss osd-panel__item-icon'
          }
          return `sm-${item.class} -${item.type} osd-panel__item-icon`
        },
      }
    },
  },
}
</script>
