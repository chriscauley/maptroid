<template>
  <div class="admin-smile-sprite" v-if="sprites">
    <div v-for="(group_sprites, group_name) in sprite_groups" :key="group_name">
      <h2>{{ group_name }} {{ group_sprites.length }}</h2>
      <div class="admin-smile-sprite__cards">
        <div
          v-for="sprite in group_sprites"
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
      </div>
      <div v-if="last" class="admin-smile-sprite__last">{{ last.category }} {{ last.type }}</div>
    </div>
    <unrest-modal v-if="selected_sprite" @close="selected_sprite = null">
      <smile-sprite-form
        :sprite="selected_sprite"
        @refetch="refetch"
        @close="selected_sprite = null"
      />
      <template #actions>{{ ' ' }}</template>
    </unrest-modal>
  </div>
</template>

<script>
import { sortBy } from 'lodash'

import SmileSpriteForm from './Form.vue'

export default {
  __route: {
    path: '/smilesprite/',
  },
  components: { SmileSpriteForm },
  data() {
    return { selected_sprite: null, last: null }
  },
  computed: {
    sprites() {
      return this.$store.smilesprite.getPage({ query: { per_page: 5000 } })?.items
    },
    sprite_groups() {
      const groups = { null: [] }
      this.sprites.forEach((s) => {
        groups[s.category] = groups[s.category] || []
        groups[s.category].push(s)
      })
      Object.entries(groups).forEach(([key, sprites]) => (groups[key] = sortBy(sprites, 'type')))
      return groups
    },
  },
  methods: {
    click(event, sprite) {
      if (event.ctrlKey && event.shiftKey && this.last) {
        event.preventDefault()
        sprite.type = this.last.type
        sprite.category = this.last.category
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
  },
}
</script>
