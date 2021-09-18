<template>
  <div :class="`viewer-panel -${open || 'closed'}`">
    <div class="list-group" v-if="'item|map|boss'.includes(open)">
      <div v-for="item in itemsByClass[open]" class="list-group-item" :key="item.id">
        <span> {{ item.id }} - {{ item.type || '???' }} </span>
        <i class="fa fa-search" @click="gotoItem(item)" />
      </div>
    </div>
    <div class="list-group" v-else-if="open === 'room'">
      <div class="list-group-item">All: {{ stats.screens.all }} / {{ stats.rooms.all }}</div>
      <template v-for="zone in zones" :key="zone">
        <div class="accordion__header" @click="toggle(zone)">
          {{ zone }} {{ stats.screens[zone] }} / {{ stats.rooms[zone] }}
        </div>
        <template v-if="zone === selected">
          <div v-for="room in rooms" class="list-group-item" :key="room.id">
            <i :class="`sm-room -${room.zone}`" />
            <span class="flex-grow">
              {{ room.name }}
            </span>
            <i class="fa fa-search" @click="gotoRoom(room)" />
          </div>
        </template>
      </template>
    </div>
    <inventory v-if="open === 'tracker'" :items="items" :world="world" />
    <warnings
      v-if="open === 'warnings'"
      :game="game"
      :items="items"
      :gotoRoom="gotoRoom"
      :gotoItem="gotoItem"
    />
    <div class="viewer-panel__buttons">
      <div
        v-for="[slug, icon, c] in panels"
        :key="slug"
        :class="css.btn(slug)"
        @click="open = slug"
      >
        <i :class="icon" />
        <div v-if="c" class="flaire">{{ c }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import OpenSeadragon from 'openseadragon'
import { sortBy } from 'lodash'

import Room from '@/models/Room'
import Item from '@/models/Item'
import Inventory from './Inventory.vue'
import Warnings from './Warnings.vue'

export default {
  components: { Inventory, Warnings },
  props: {
    viewer: Object,
    world: Object,
    game: Object,
  },
  data() {
    return {
      open: 'tracker',
      selected: null,
      zones: this.world.zones,
      css: {
        btn: (name) => ['btn', name === this.open ? '-primary' : '-secondary'],
      },
    }
  },
  computed: {
    panels() {
      return [
        ['tracker', 'fa fa-check-square-o'],
        ['item', 'fa fa-list', this.itemsByClass.item.length],
        ['map', 'sm-map -map', this.itemsByClass.map.length],
        ['boss', 'sm-map -boss', this.itemsByClass.boss.length],
        ['room', 'sm-room -brinstar', this.rooms.length],
        ['warnings', 'fa fa-warning'],
      ]
    },
    items() {
      return this.$store.item.getAll({ world_id: this.world.id })
    },
    itemsByClass() {
      const items = {
        map: [],
        boss: [],
        item: [],
        chozo: [],
        door: [],
      }
      const _all = sortBy(this.items, 'type')
      _all.forEach((i) => items[i.class].push(i))
      return items
    },
    rooms() {
      return this.$store.room.getAll({ world_id: this.world.id })
    },
    stats() {
      const stats = {
        rooms: { all: 0 },
        screens: { all: 0 },
        groups: {},
      }
      this.rooms.forEach((room) => {
        const { zone } = room
        if (!stats.groups[zone]) {
          stats.groups[zone] = []
        }
        stats.rooms.all += 1
        stats.screens.all += room.xys.length
        stats.rooms[zone] = (stats.rooms[zone] || 0) + 1
        stats.screens[zone] = (stats.screens[zone] || 0) + room.xys.length
        stats.groups[zone].push(room)
      })
      return stats
    },
  },
  methods: {
    gotoItem(item) {
      const { room_id } = item
      const room = room_id && this.$store.room.getOne(room_id)
      if (room) {
        this.gotoRoom(room)
      } else {
        const { x, y, width, height } = Item.getMapBounds(item, this.world)
        this.goto(x, y, width, height)
      }
      this.viewer.addOnceHandler('animation-finish', () =>
        this.$store.viewer.patch({ selected_item: item.id }),
      )
    },
    gotoRoom(room) {
      const [x, y, width, height] = Room.getMapBounds(room, this.world)
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
