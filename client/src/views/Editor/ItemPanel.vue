<template>
  <div v-if="open" :class="`viewer-panel -${open || 'closed'}`">
    <div class="list-group" v-if="'item|map|boss'.includes(open)">
      <div v-for="item in itemsByClass[open]" class="list-group-item" :key="item.id">
        <span> {{ item.id }} - {{ item.type || '???' }} </span>
        <i class="fa fa-search" @click="gotoItem(item)" />
      </div>
    </div>
    <div class="list-group" v-else-if="open === 'room'">
      <div class="list-group-item">All: {{ stats.screens.all }} / {{ stats.rooms.all }}</div>
      <template v-for="area in areas" :key="area">
        <div class="accordion__header" @click="toggle(area)">
          {{ area }} {{ stats.screens[area] }} / {{ stats.rooms[area] }}
        </div>
        <template v-if="area === selected">
          <div v-for="room in rooms" class="list-group-item" :key="room.id">
            <i :class="`sm-room -${room.area}`" />
            <span class="flex-grow">
              {{ room.name }}
            </span>
            <i class="fa fa-search" @click="gotoRoom(room)" />
          </div>
        </template>
      </template>
    </div>
    <div v-if="open === 'tracker'" class="tracker__grid">
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
      <div :class="css.btn('item')" @click="open = 'item'">
        <i class="fa fa-list" />
        <div class="flaire">{{ itemsByClass.item.length }}</div>
      </div>
      <div :class="css.btn('map')" @click="open = 'map'">
        <i class="sm-map -map" />
        <div class="flaire">{{ itemsByClass.map.length }}</div>
      </div>
      <div :class="css.btn('boss')" @click="open = 'boss'">
        <i class="sm-map -boss" />
        <div class="flaire">{{ itemsByClass.boss.length }}</div>
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
import { sortBy } from 'lodash'

import Area from '@/models/Area'

export default {
  props: {
    viewer: Object,
  },
  data() {
    return {
      open: 'tracker',
      selected: null,
      areas: Area.list,
      css: {
        btn: (name) => ['btn', name === this.open ? '-primary' : '-secondary'],
      },
    }
  },
  computed: {
    itemsByClass() {
      const items = {
        map: [],
        boss: [],
        item: [],
        chozo: [],
        door: [],
      }
      const _all = sortBy(this.$store.item.getAll(), 'type')
      _all.forEach((i) => items[i.class].push(i))
      return items
    },
    rooms() {
      return this.$store.room.getAll()
    },
    stats() {
      const stats = {
        rooms: { all: 0 },
        screens: { all: 0 },
        groups: {},
      }
      this.rooms.forEach((room) => {
        const { area } = room
        if (!stats.groups[area]) {
          stats.groups[area] = []
        }
        stats.rooms.all += 1
        stats.screens.all += room.xys.length
        stats.rooms[area] = (stats.rooms[area] || 0) + 1
        stats.screens[area] = (stats.screens[area] || 0) + room.xys.length
        stats.groups[area].push(room)
      })
      return stats
    },
  },
  methods: {
    gotoItem(item) {
      const { x, y, width, height } = item
      this.goto(x, y, width, height)
      this.viewer.addOnceHandler('animation-finish', () =>
        this.$store.viewer.patch({ selected_item: item.id }),
      )
    },
    gotoRoom(room) {
      const [x, y, width, height] = room.getMapBounds()
      this.goto(x, y, width, height)
    },
    goto(x, y, width, height) {
      const b = 192
      const bounds = new OpenSeadragon.Rect(x - b, y - b, width + b * 4, height + b * 2)
      const { viewport } = this.viewer
      viewport.fitBounds(viewport.imageToViewportRectangle(bounds))
    },
    toggle(key) {
      this.selected = this.selected === key ? null : key
    },
  },
}
</script>
