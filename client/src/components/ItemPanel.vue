<template>
  <div v-if="open" class="viewer-panel">
    <div class="list-group">
      <div v-for="item in items" class="list-group-item" :key="item.id">
        <span> {{ item.id }} - {{ item.type || '???' }} </span>
        <i class="fa fa-search" @click="goto(item)" />
      </div>
    </div>
  </div>
  <div v-else class="viewer-panel__buttons">
    <div class="btn -primary" @click="open = true">
      <i class="fa fa-list" />
      <div class="flaire">{{ items.length }}</div>
    </div>
  </div>
</template>

<script>
import OpenSeadragon from 'openseadragon'
window.OSD = OpenSeadragon

export default {
  props: {
    viewer: Object,
  },
  data() {
    return { open: false }
  },
  computed: {
    items() {
      return this.$store.item.getItems()
    },
  },
  methods: {
    goto(item) {
      if (!this.viewer) {
        return
      }
      const { x, y } = item
      const { viewport } = this.viewer
      const b = 192
      const bounds = new OpenSeadragon.Rect(x - b, y - b, b * 4, b * 2)
      viewport.fitBounds(viewport.imageToViewportRectangle(bounds))
      this.viewer.addOnceHandler('animation-finish', () =>
        this.$store.viewer.patch({ selected_item: item.id }),
      )
    },
  },
}
</script>
