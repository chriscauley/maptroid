<template>
  <div class="sm-plm-enemies" v-if="world && rooms && current_room">
    <div class="sm-plm-enemies__top">
      <select v-model="current_room_index">
        <option v-for="item in select_items.bad" :value="item.id" :key="item.id">
          :( {{ item.text }}
        </option>
        <option>----</option>
        <option v-for="item in select_items.good" :value="item.id" :key="item.id">
          {{ item.text }}
        </option>
      </select>
      <div v-for="plm in plms.filter((p) => p._plm.deleted)" :key="plm.src" class="_deleted">
        <i class="fas fa-trash" @click="undelete(plm)" />
        <a class="far fa-question-circle" :href="plm.src" target="_blank" />
      </div>
    </div>
    <div class="sm-plm-enemies__workarea" v-if="current_room">
      <div class="sm-plm-enemies__wrapper">
        <img :src="`/media/sm_cache/${world.slug}/layer-1/${current_room.key}`" ref="img" />
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
      </div>
    </div>
  </div>
</template>

<script>
import { sortBy } from 'lodash'
import Mousetrap from '@unrest/vue-mousetrap'

const clamp = (number, lower, upper) => Math.max(lower, Math.min(number, upper))

export default {
  __route: {
    path: '/sm-plm-align/:world_slug/',
  },
  mixins: [Mousetrap.Mixin],
  data() {
    return { mode: 'arrange', zIndexes: {} }
  },
  computed: {
    current_room() {
      return this.rooms.find((r) => r.id === this.current_room_index) || this.rooms[0]
    },
    current_room_index: {
      get() {
        return this.$store.local.state.plm_index
      },
      set(value) {
        this.$store.local.save({ plm_index: value })
      },
    },
    world() {
      return this.$store.world.getFromRoute(this.$route).current
    },
    rooms() {
      const world = this.world.id
      const rooms = this.$store.room.getPage({ query: { per_page: 5000, world } })?.items
      return rooms?.filter((r) => r.data.plm_enemies)
    },
    select_items() {
      const bad = []
      const good = []
      this.rooms.forEach((room) => {
        const valid_plms = room.data.plm_enemies?.filter((i) => !i.deleted)
        const count = valid_plms.length || '☹️'
        const name = room.name?.slice(0, 30)
        const coords = new Set(valid_plms.map((p) => p.xy.toString()))
        const fail = coords.size !== valid_plms.length
        const text = `${count} - ${name} #${room.id}`
        ;(fail ? bad : good).push({ count, name, id: room.id, text })
      })
      return {
        bad: sortBy(bad, 'count').reverse(),
        good: sortBy(good, 'count').reverse(),
      }
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
      this.$store.room.bounceSave(this.current_room)
    },
    click(event, plm) {
      if (event.ctrlKey && event.shiftKey) {
        plm._plm.deleted = true
        this.$store.room.bounceSave(this.current_room)
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
      this.$store.room.bounceSave(this.current_room)
    },
  },
}
</script>
