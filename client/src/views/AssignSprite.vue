<template>
  <div class="admin-smile-sprite" v-if="plmsprites">
    <div class="admin-smile-sprite__groups btn-group">
      <div class="admin-smile-sprite__cards">
        <div
          v-for="sprite in plmsprites.items"
          :key="sprite.id"
          class="admin-smile-sprite__card"
          @click="click(sprite)"
        >
          <div class="admin-smile-sprite__img" :style="`background-image: url('${sprite.url}')`" />
        </div>
      </div>
    </div>
    <assign-sprite-form
      v-if="selected_sprite"
      :sprite="selected_sprite"
      @refetch="refetch"
      @close="selected_sprite = null"
    />
  </div>
</template>

<script>
import AssignSpriteForm from './AssignSpriteForm.vue'

export default {
  components: { AssignSpriteForm },
  __route: {
    path: '/app/assign-sprite/',
  },
  data() {
    return { selected_sprite: null }
  },
  computed: {
    plmsprites() {
      return this.$store.plmsprite.getPage({ query: { matchedsprite__isnull: true } })
    },
  },
  methods: {
    click(sprite) {
      this.selected_sprite = sprite
    },
  },
}
</script>
