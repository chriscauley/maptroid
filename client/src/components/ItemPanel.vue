<template>
  <div v-if="open" :class="`viewer-panel -${open || 'closed'}`">
    <div class="list-group" v-if="open === 'list'">
      <div v-for="item in items" class="list-group-item" :key="item.id">
        <span> {{ item.id }} - {{ item.type || '???' }} </span>
        <i class="fa fa-search" @click="goto(item)" />
      </div>
    </div>
    <div class="list-group" v-else-if="open === 'room'">
      <div v-for="room in rooms" class="list-group-item" :key="room.id">
        <i :class="`sm-room -${room.area}`" />
        <span class="flex-grow">
          {{ room.name }}
        </span>
        <i class="fa fa-search" @click="gotoRoom(room)" />
      </div>
    </div>
    <div v-else class="tracker__grid">
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
      <div :class="css.btn('room')" @click="open = 'room'">
        <i class="sm-room -brinstar" />
        <div class="flaire">{{ rooms.length }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import OpenSeadragon from 'openseadragon'

import Room from '@/models/Room'

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
    rooms() {
      return this.$store.room.getAll()
    },
  },
  methods: {
    gotoItem(item) {
      const { x, y } = item
      this.goto(x, y, 16, 16)
      this.viewer.addOnceHandler('animation-finish', () =>
        this.$store.viewer.patch({ selected_item: item.id }),
      )
    },
    gotoRoom(room) {
      const [x, y, width, height] = Room.getMapBounds(room)
      this.goto(x, y, width, height)
    },
    goto(x, y, width, height) {
      const b = 192
      const bounds = new OpenSeadragon.Rect(x - b, y - b, width + b * 4, height + b * 2)
      const { viewport } = this.viewer
      viewport.fitBounds(viewport.imageToViewportRectangle(bounds))
    },
  },
}
</script>
