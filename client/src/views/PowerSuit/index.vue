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
        <template v-if="selected">
          <div class="list-group-item list-group-item-action" @click="selected = null">
            &lt;&lt;
          </div>
          <div class="list-group-item">
            <sprite-box :sprite="selected" :rects="state.rects" :img="$refs.img" />
          </div>
        </template>
        <template v-else>
          <div
            v-for="animation in state.animations"
            :class="animationListClass(animation)"
            :key="animation"
            @click="selected = animation"
          >
            {{ animation.name }}
          </div>
          <animation-form @save="save" />
        </template>
      </div>
      x
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
    return { state: {}, selected: null }
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
  },
  mounted() {
    client.get('/power-suit/').then((data) => (this.state = data))
  },
  methods: {
    rectClass(rect) {
      const indexes = this.selected?.indexes || []
      return ['power-suit__rect', indexes.includes(rect.index) && '-green']
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
  },
}
</script>
