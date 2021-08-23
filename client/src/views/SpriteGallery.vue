<template>
  <div class="modal -absolute sprite-gallery">
    <div class="modal-content">
      <template v-for="item in items" :key="item">
        <i :class="`sm-item ${item}`" :title="item" />
        <i :class="`sm-item ${item}-alt`" :title="`${item}-alt`" />
      </template>
    </div>
  </div>
</template>

<script>
import Item from '@/models/Item'

export default {
  data() {
    return { items: Item.all }
  },
}
</script>
