<template>
  <div class="app-body -full-screen power-suit">
    <div class="power-suit__inner">
      <div class="power-suit__left">
        <div class="list-group">
          <div
            v-for="animation in animations"
            :class="animationListClass(animation)"
            :key="animation"
            @click="selected = animation"
          >
            {{ animation.name }}
            {{ Object.keys(animation.offsets).length }}
            /
            {{ animation.sprite_ids.length }}
            <input type="checkbox" v-model="compare[animation.name]" @click.stop />
          </div>
          <div class="list-group-item">
            <animation-form @save="storage.addAnimation" />
          </div>
        </div>
      </div>
      <div class="power-suit__left">
        <div class="power-suit__spritesheet">
          <img :src="storage.img_url" />
          <div
            v-for="rect in rects"
            :key="rect.sprite_id"
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
              <sprite-box :sprite="sprite" :rects="rects" :compare="true" :storage="storage" />
            </div>
            <sprite-box :sprite="selected" :key="selected.name" :storage="storage" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AnimationForm from './Form.vue'
import SpriteBox from './SpriteBox.vue'

import Storage from './store' // TODO rename store.js to Storage.js

export default {
  __route: {
    path: '/spritesheet/:sheetname/',
  },
  components: { SpriteBox, AnimationForm },
  data() {
    return { selected: null, compare: {} }
  },
  computed: {
    storage() {
      return Storage(this.$route.params.sheetname)
    },
    animations() {
      return this.storage.use()?.animations || {}
    },
    rects() {
      return this.storage.use()?.rects.map(([x, y, w, h], sprite_id) => ({
        sprite_id,
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
      Object.values(this.animations).forEach((a) => a.sprite_ids.forEach((i) => (used[i] = true)))
      return used
    },
    compare_sprites() {
      return Object.values(this.animations).filter((a) => this.compare[a.name])
    },
  },
  methods: {
    rectClass(rect) {
      const sprite_ids = this.selected?.sprite_ids || []
      const selected = sprite_ids.includes(rect.sprite_id)
      return [
        'power-suit__rect',
        selected && '-in-sprite',
        !selected && this.used[rect.sprite_id] && '-used',
      ]
    },
    clickRect(rect) {
      if (!this.selected) {
        return
      }
      const { sprite_id } = rect
      const { sprite_ids } = this.selected
      if (sprite_ids.includes(sprite_id)) {
        sprite_ids.splice(sprite_ids.indexOf(sprite_id), 1)
      } else {
        sprite_ids.push(sprite_id)
      }
      this.storage.save()
    },
    selectSprite(sprite) {
      this.selected = sprite
    },
    animationListClass(sprite) {
      return ['list-group-item', this.selected === sprite && '-selected']
    },
    getRectOrder(rect) {
      const order = ((this.selected || {}).sprite_ids || []).indexOf(rect.sprite_id)
      return order > -1 ? order : ''
    },
  },
}
</script>
