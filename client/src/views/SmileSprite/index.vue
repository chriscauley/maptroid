<template>
  <div class="admin-smile-sprite" v-if="sprites">
    <div v-for="(group_sprites, group_name) in sprite_groups" :key="group_name">
      <h2>{{ group_name }}</h2>
      <div class="admin-smile-sprite__cards">
        <div
          v-for="sprite in group_sprites"
          :key="sprite.id"
          class="admin-smile-sprite__card"
          @click="selected_sprite = sprite"
        >
          <div class="admin-smile-sprite__img" :style="`background-image: url('${sprite.url}')`" />
          <div>
            <div>#{{ sprite.id }}</div>
            {{ getName(sprite) }}
          </div>
        </div>
      </div>
    </div>
    <unrest-modal v-if="selected_sprite" @close="selected_sprite = null">
      <smile-sprite-form :sprite="selected_sprite" />
      <template #actions>{{ ' ' }}</template>
    </unrest-modal>
  </div>
</template>

<script>
import SmileSpriteForm from './Form.vue'

export default {
  __route: {
    path: '/smilesprite/:smilesprite_id?',
  },
  components: { SmileSpriteForm },
  data() {
    return { selected_sprite: null }
  },
  computed: {
    sprites() {
      return this.$store.smilesprite.getPage({ query: { per_page: 5000 } })?.items
    },
    sprite_groups() {
      const named = this.sprites.filter((s) => s.name)
      const unnamed = this.sprites.filter((s) => !s.name)
      return { named, unnamed }
    },
  },
  methods: {
    getName(sprite) {
      return sprite.name || sprite.url.split('/').pop()
    },
  },
}
</script>
