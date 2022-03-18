<template>
  <div class="app-body -full-screen power-suit">
    <div class="power-suit__inner">
      <div class="power-suit__left">
        <div class="list-group">
          <div
            v-for="animation in state.animations"
            :class="animationListClass(animation)"
            :key="animation"
            @click="selected = animation"
          >
            {{ animation.name }}
            <input type="checkbox" v-model="compare[animation.name]" @click.stop />
          </div>
          <div class="list-group-item">
            <animation-form @save="save" />
          </div>
        </div>
      </div>
      <div class="power-suit__left">
        <div class="power-suit__spritesheet">
          <img src="/static/sm/power-suit.png" ref="img" />
          <div
            v-for="rect in rects"
            :key="rect.index"
            :style="rect.style"
            :class="rectClass(rect)"
            @click="clickRect(rect)"
            :data-i="getRectOrder(rect)"
          />
        </div>
      </div>
      <div class="power-suit__right">
        <div class="list-group" v-if="selected">
          <div class="list-group-item">
            <div v-for="sprite in compare_sprites" :key="sprite.name">
              <sprite-box :sprite="sprite" :rects="state.rects" :img="$refs.img" :compare="true" />
            </div>
            <sprite-box :sprite="selected" :rects="state.rects" :img="$refs.img" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getClient } from '@unrest/vue-storage'

import AnimationForm from './Form.vue'
import SpriteBox from './SpriteBox.vue'

const client = getClient()

export default {
  __route: {
    path: '/sprite/power-suit/',
  },
  components: { SpriteBox, AnimationForm },
  data() {
    return { state: {}, selected: null, compare: {} }
  },
  computed: {
    rects() {
      return this.state.rects?.map(([x, y, w, h], index) => ({
        index,
        style: {
          left: `${x}px`,
          top: `${y}px`,
          width: `${w}px`,
          height: `${h}px`,
        },
      }))
    },
    used() {
      const used = {}
      Object.values(this.state.animations || {}).forEach((a) =>
        a.indexes.forEach((i) => (used[i] = true)),
      )
      return used
    },
    compare_sprites() {
      return Object.values(this.state.animations).filter((a) => this.compare[a.name])
    },
  },
  mounted() {
    client.get('/power-suit/').then((data) => (this.state = data))
  },
  methods: {
    rectClass(rect) {
      const indexes = this.selected?.indexes || []
      const selected = indexes.includes(rect.index)
      return [
        'power-suit__rect',
        selected && '-in-sprite',
        !selected && this.used[rect.index] && '-used',
      ]
    },
    clickRect(rect) {
      if (!this.selected) {
        return
      }
      const { index } = rect
      const { indexes } = this.selected
      if (indexes.includes(index)) {
        indexes.splice(indexes.indexOf(index), 1)
      } else {
        indexes.push(index)
      }
      this.save()
    },
    selectSprite(sprite) {
      this.selected = sprite
    },
    animationListClass(sprite) {
      return ['list-group-item', this.selected === sprite && '-selected']
    },
    save(sprite) {
      if (sprite) {
        const { name } = sprite
        sprite = {
          indexes: [],
          offsets: {},
          ...sprite,
        }
        this.state.animations[name] = sprite
      }
      client.post('/power-suit/', this.state)
    },
    getRectOrder(rect) {
      const order = ((this.selected || {}).indexes || []).indexOf(rect.index)
      return order > -1 ? order : ''
    },
  },
}
</script>
