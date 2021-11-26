<template>
  <div class="sm-plm-enemies" v-if="world && rooms && current_room">
    <div class="sm-plm-enemies__top">
      <select v-model="current_room_index">
        <option v-for="item in select_items" :value="item.id" :key="item.id">
          {{ item.count }} - {{ item.name }}
        </option>
      </select>
      <div class="btn-group">
        <div
          :class="['btn', mode === 'arrange' ? '-primary' : '-secondary']"
          @click="mode = 'arrange'"
        >
          Arrange
        </div>
        <div
          :class="['btn', mode === 'sprite' ? '-primary' : '-secondary']"
          @click="mode = 'sprite'"
        >
          Sprite
        </div>
      </div>
      <div v-for="plm in plms.filter((p) => p._plm.deleted)" :key="plm.src" class="_deleted">
        <i class="fa fa-trash" @click="undelete(plm)" />
        <a class="fa fa-question-circle-o" :href="plm.src" target="_blank" />
      </div>
    </div>
    <div class="sm-plm-enemies__workarea" v-if="current_room">
      <div class="sm-plm-enemies__wrapper">
        <img :src="`/media/sm_room/${world.slug}/${current_room.key}`" ref="img" />
        <unrest-draggable
          v-for="plm in plms.filter((p) => !p._plm.deleted)"
          :key="plm.src"
          class="sm-plm-enemies__cropped"
          :style="plm.style"
          @drag="(e) => drag(e, plm)"
          @click="(e) => click(e, plm)"
        >
          <img :src="plm.src" />
        </unrest-draggable>
        <div class="sm-plm-enemies__grid" :style="grid_style" />
        <plm-snap
          v-if="mode === 'sprite'"
          :key="current_room_index"
          :room="current_room"
          :plms="plms"
          :img="$refs.img"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { sortBy } from 'lodash'
import Mousetrap from '@unrest/vue-mousetrap'

import PlmSnap from './PlmSnap.vue'

const clamp = (number, lower, upper) => Math.max(lower, Math.min(number, upper))
const grid_cache = {}
const grid_colors = ['#888', 'black', 'transparent']

export default {
  __route: {
    path: '/sm-plm-enemies/:world_slug/',
  },
  components: { PlmSnap },
  mixins: [Mousetrap.Mixin],
  data() {
    return { mode: 'arrange', zIndexes: {} }
  },
  computed: {
    mousetrap() {
      return {
        g: () => {
          const plm_grid = ((this.$store.local.state.plm_grid || 0) + 1) % grid_colors.length
          this.$store.local.save({ plm_grid })
        },
      }
    },
    current_room() {
      return this.rooms.find((r) => r.id === this.current_room_index)
    },
    current_room_index: {
      get() {
        return this.$store.local.state.plm_index
      },
      set(value) {
        this.$store.local.save({ plm_index: value })
      },
    },
    grid_style() {
      const color = grid_colors[this.$store.local.state.plm_grid || 0]
      if (!grid_cache[color]) {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 16
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = color
        ctx.rect(0, 15, 16, 16)
        ctx.rect(15, 0, 16, 16)
        ctx.fill()
        grid_cache[color] = canvas.toDataURL()
      }
      return {
        backgroundImage: `url("${grid_cache[color]}")`,
      }
    },
    world() {
      return this.$store.world2.getFromRoute(this.$route).current
    },
    rooms() {
      const world = this.world.id
      const rooms = this.$store.room2.getPage({ query: { per_page: 5000, world } })?.items
      return rooms?.filter((r) => r.data.plm_enemies)
    },
    select_items() {
      const items = this.rooms.map((room) => {
        return {
          count: room.data.plm_enemies?.filter((i) => !i.deleted).length || '☹️',
          name: room.name?.slice(0, 30),
          id: room.id,
        }
      })
      return sortBy(items, 'count').reverse()
    },
    plms() {
      return this.current_room.data.plm_enemies?.map((plm) => {
        const [x, y] = plm.xy
        return {
          _plm: plm,
          src: `${plm.root_url}/${plm.cropped}`,
          class: 'sm-plm-enemies__cropped',
          style: {
            left: `${x}px`,
            top: `${y}px`,
            zIndex: 10 - (this.zIndexes[plm.cropped] || 0),
          },
        }
      })
    },
  },
  methods: {
    undelete(plm) {
      delete plm._plm.deleted
      this.$store.room2.bounceSave(this.current_room)
    },
    click(event, plm) {
      if (event.ctrlKey && event.shiftKey) {
        plm._plm.deleted = true
        this.$store.room2.bounceSave(this.current_room)
      }
      if (event.shiftKey) {
        const { cropped } = plm._plm
        this.zIndexes[cropped] = ((this.zIndexes[cropped] || 0) + 1) % 10
      }
    },
    drag(event, plm) {
      const [dx, dy] = event._drag.last_dxy
      plm._plm.xy[0] += dx
      plm._plm.xy[1] += dy
      if (!event.shiftKey) {
        const plm_img = this.$el.querySelector(`[src="${plm.src}"]`)
        const img = this.$refs.img
        const x_max = img.width - plm_img.width - 1
        const y_max = img.height - plm_img.height - 1
        plm._plm.xy[0] = clamp(plm._plm.xy[0], 0, x_max)
        plm._plm.xy[1] = clamp(plm._plm.xy[1], 0, y_max)
      }
      this.$store.room2.bounceSave(this.current_room)
    },
  },
}
</script>
