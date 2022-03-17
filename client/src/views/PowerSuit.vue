<template>
  <div class="app-body -full-screen power-suit">
    <div class="power-suit__left">
      <img src="/static/sm/power-suit.png" ref="img" />
      <div
        v-for="rect in rects"
        :key="rect.index"
        :style="rect.style"
        :class="rectClass(rect)"
        @click="clickRect(rect)"
      />
    </div>
    <div class="power-suit__right">
      <div class="list-group">
        <div
          v-for="sprite in sprites"
          :class="spriteListClass(sprite)"
          :key="sprite.id"
          @click="selected = sprite"
        >
          {{ sprite.name }}
        </div>
        <div class="list-group-item">
          <unrest-form :state="state" :schema="schema" @submit="addSprite" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const schema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string' },
  },
}

export default {
  __route: {
    path: '/sprite/power-suit/',
  },
  data() {
    window.that = this
    return { raw_rects: [], schema, state: {}, selected: null }
  },
  computed: {
    sprites() {
      return this.$store.powersuit.getPage({ query: { per_page: 5000 } })?.items
    },
    rects() {
      return this.raw_rects.map(([x, y, w, h], index) => ({
        index,
        style: {
          left: `${x}px`,
          top: `${y}px`,
          width: `${w}px`,
          height: `${h}px`,
        },
      }))
    },
  },
  mounted() {
    axios.get('/static/sm/power-suit.json').then(({ data }) => (this.raw_rects = data))
  },
  methods: {
    rectClass(rect) {
      const indexes = this.selected?.data.indexes || []
      return ['power-suit__rect', indexes.includes(rect.index) && '-green']
    },
    clickRect(rect) {
      if (!this.selected) {
        return
      }
      const { index } = rect
      const { indexes } = this.selected.data
      if (indexes.includes(index)) {
        indexes.splice(indexes.indexOf(index), 1)
      } else {
        indexes.push(index)
      }
      this.$store.powersuit.bounceSave(this.selected)
    },
    selectSprite(sprite) {
      this.selected = sprite
    },
    addSprite() {
      const { state } = this
      state.data = state.data || { indexes: [] }
      return this.$store.powersuit.save(state).then(this.refetch)
    },
    refetch() {
      this.$store.powersuit.api.markStale()
      return this.$store.powersuit.getPage({ query: { per_page: 5000 } })
    },
    spriteListClass(sprite) {
      return ['list-group-item', this.selected === sprite && '-selected']
    },
  },
}
</script>
