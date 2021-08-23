<template>
  <div v-if="open" :class="`viewer-panel -${open || 'closed'}`">
    <div class="list-group" v-if="open === 'list'">
      <div v-for="item in items" class="list-group-item" :key="item.id">
        <span> {{ item.id }} - {{ item.type || '???' }} </span>
        <i class="fa fa-search" @click="goto(item)" />
      </div>
    </div>
    <div class="tracker__grid">
      <div v-for="(row, i) in $store.item.getGrid()" class="tracker__row" :key="i">
        <div v-for="cell in row" :class="cell.class" :key="cell.slug">
          <div v-if="cell.count" class="flaire">{{ cell.count }}</div>
        </div>
      </div>
    </div>
    <div class="viewer-panel__buttons">
      <div :class="css.btn('tracker')" @click="open = 'tracker'">
        <i class="fa fa-check-square-o" />
      </div>
      <div :class="css.btn('list')" @click="open = 'list'">
        <i class="fa fa-list" />
        <div class="flaire">{{ items.length }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import OpenSeadragon from 'openseadragon'

export default {
  props: {
    viewer: Object,
  },
  data() {
    return {
      open: 'tracker',
      css: {
        btn: (name) => ['btn', name === this.open ? '-primary' : '-secondary'],
      },
    }
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
