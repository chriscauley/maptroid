<template>
  <div class="admin-smile-sprite" v-if="sprites">
    <div class="admin-smile-sprite__groups btn-group">
      <router-link
        v-for="(count, name) in group_counts"
        :key="name"
        :class="`btn -${name === $route.params.category ? 'primary' : 'secondary'}`"
        :to="`/staff/smilesprite/${name}`"
      >
        {{ name }}
        {{ count }}
      </router-link>
    </div>
    <h2>{{ $route.params.category }}</h2>
    <div class="admin-smile-sprite__cards">
      <div
        v-for="sprite in current_sprites"
        :key="sprite.id"
        class="admin-smile-sprite__card"
        @click="(e) => click(e, sprite)"
      >
        <div class="admin-smile-sprite__img" :style="`background-image: url('${sprite.url}')`" />
        <div>
          <div>#{{ sprite.id }} {{ sprite.color || sprite.modifier }}</div>
          <div>{{ sprite.type || '???' }}</div>
        </div>
      </div>
      <div v-if="last" class="admin-smile-sprite__last">{{ last.category }} {{ last.type }}</div>
    </div>
    <smile-sprite-form
      v-if="selected_sprite"
      :sprite="selected_sprite"
      @refetch="refetch"
      @close="selected_sprite = null"
      @select-dindex="selectDindex"
    />
  </div>
</template>

<script>
import { sortBy } from 'lodash'

import SmileSpriteForm from './Form.vue'

export default {
  __route: {
    path: '/staff/smilesprite/:category?',
  },
  components: { SmileSpriteForm },
  data() {
    return { selected_sprite: null, last: null }
  },
  computed: {
    sprites() {
      return this.$store.smilesprite.getPage({ query: { per_page: 5000 } })?.items
    },
    group_counts() {
      const groups = { null: 0 }
      this.sprites.forEach((s) => (groups[s.category] = (groups[s.category] || 0) + 1))
      return groups
    },
    current_sprites() {
      let category = this.$route.params.category || null
      category = category === 'null' ? null : category
      const sprites = this.sprites.filter((s) => s.category === category)
      return sortBy(sprites, 'type')
    },
    current_group() {
      return this.groups.find((g) => g.category === this.$route.params.category)
    },
  },
  methods: {
    click(event, sprite) {
      if (event.ctrlKey && event.shiftKey && this.last) {
        event.preventDefault()
        sprite.type = this.last.type
        sprite.category = this.last.category
        sprite.modifier = this.last.modifier
        this.$store.smilesprite.save(sprite).then(() => this.refetch())
      } else {
        this.selected_sprite = sprite
      }
    },
    refetch(last) {
      this.$store.smilesprite.api.markStale()
      this.$store.smilesprite.fetchPage({ query: { per_page: 5000 } }).then(({ items }) => {
        if (last) {
          this.last = items.find((s) => s.id === last)
        }
      })
    },
    selectDindex(dindex) {
      const matchSprite = (s) => s === this.selected_sprite
      const group_sprites = Object.values(this.sprite_groups).find((gs) => gs.find(matchSprite))
      const new_index = group_sprites.findIndex(matchSprite) + dindex
      this.selected_sprite = group_sprites[new_index % group_sprites.length]
    },
  },
}
</script>
