<template>
  <div class="admin-smile-sprite" v-if="plmsprites">
    <div class="admin-smile-sprite__groups -plmsprites">
      <h3>Unmatched PLM Sprites ({{ plmsprites.length }})</h3>
      <div class="admin-smile-sprite__cards">
        <div
          v-for="sprite in plmsprites"
          :key="sprite.id"
          class="admin-smile-sprite__card -plm"
          @click="(e) => clickPlm(e, sprite)"
          @mouseover="hoverPlmsprite(sprite)"
        >
          <div class="admin-smile-sprite__img" :style="`background-image: url('${sprite.url}')`" />
        </div>
      </div>
    </div>
    <div class="admin-smile-sprite__groups btn-group">
      <div
        v-for="(count, category) in category_counts"
        :key="category"
        :class="`btn -${category === active_category ? 'primary' : 'secondary'}`"
        @click="setCategory(category)"
      >
        {{ category }} ({{ count }})
      </div>
    </div>
    <div class="admin-smile-sprite__cards -matchedsprites">
      <unrest-draggable
        v-for="sprite in visible_matchedsprites"
        :key="sprite.id"
        :class="sprite.class"
        @click="selected_matchedsprite = sprite"
        @dragstart="dragstart"
        @dragend="dropMatchedsprite(sprite)"
      >
        <div class="admin-smile-sprite__img" :style="`background-image: url('${sprite.url}')`" />
        <div>{{ sprite.data.approval_count || '??' }} / {{ sprite.plmsprite__count }}</div>
      </unrest-draggable>
    </div>

    <plmsprite-form
      v-if="selected_plmsprite"
      :sprite="selected_plmsprite"
      @close="close"
      @automatch="automatch"
      :category="active_category"
    />
    <matchedsprite-form
      v-if="selected_matchedsprite"
      :id="selected_matchedsprite.id"
      @close="close"
      @next="nextMatchedsprite"
      :key="selected_matchedsprite.id"
    />
  </div>
</template>

<script>
import { sortBy } from 'lodash'
import { mod } from '@unrest/geo'
import { getClient } from '@unrest/vue-storage'

import MatchedspriteForm from './MatchedspriteForm.vue'
import PlmspriteForm from './PlmspriteForm.vue'

const client = getClient()

export default {
  components: { MatchedspriteForm, PlmspriteForm },
  __route: {
    path: '/app/assign-sprite/',
  },
  data() {
    return {
      dragging: false,
      hovered: null,
      selected_plmsprite: null,
      selected_matchedsprite: null,
    }
  },
  computed: {
    plmsprites() {
      return this.getPlmsprites()
    },
    matchedsprites() {
      return this.getMatchedsprites()
    },
    category_counts() {
      const counts = {}
      this.matchedsprites.forEach((m) => {
        counts[m.category] = (counts[m.category] || 0) + 1
      })
      return counts
    },
    active_category() {
      if (this.$route.query.category === 'null') {
        return null
      }
      return this.$route.query.category || 'enemy'
    },
    visible_matchedsprites() {
      const { active_category } = this
      const sprites = this.matchedsprites.filter((m) => m.category === active_category)
      sprites.forEach((sprite) => {
        sprite.approved = sprite.data.approval_count === sprite.plmsprite__count
        sprite.class = ['admin-smile-sprite__card', !sprite.approved && '-red']
      })
      return sortBy(sprites, 'short_code')
    },
  },
  methods: {
    setCategory(category) {
      this.$router.replace({ query: { ...this.$route.query, category } })
    },
    close() {
      this.selected_matchedsprite = null
      this.selected_plmsprite = null
      this.refetchAll()
    },
    refetchAll() {
      this.$store.plmsprite.api.markStale()
      this.$store.matchedsprite.api.markStale()
      this.getPlmsprites()
      this.getMatchedsprites()
    },
    getPlmsprites() {
      const query = { per_page: 5000, matchedsprite__isnull: true }
      return this.$store.plmsprite.getPage({ query })?.items
    },
    getMatchedsprites() {
      const query = { per_page: 10000 }
      return this.$store.matchedsprite.getPage({ query })?.items || []
    },
    clickPlm(e, sprite) {
      if (e.shiftKey && e.ctrlKey) {
        this.automatch(sprite)
      } else {
        this.selected_plmsprite = sprite
      }
    },
    automatch(sprite) {
      const post = client.post(`sprite/automatch/${sprite.id}/`)
      post.then(this.completeAutomatch)
    },
    completeAutomatch(result) {
      if (result.url) {
        const href = `/app/labbook/${result.name}/`
        this.$ui.toast({
          level: result.success ? 'success' : 'error',
          tagName: () => (
            <div>
              <a href={href} class="btn -link" target="_blank">
                View Labbook
                <i class="fa fa-arrow-up-right-from-square" />
              </a>
              {result.results?.join(', ')}
            </div>
          ),
        })
      } else {
        this.$ui.toast.error('Labbook wasn not generated')
      }
      this.close()
    },
    nextMatchedsprite(dindex) {
      const sprites = this.visible_matchedsprites
      const index = sprites.indexOf(this.selected_matchedsprite)
      this.selected_matchedsprite = sprites[mod(index + dindex, sprites.length)]
    },
    dragstart() {
      this.dragging = true
      this.hovered = null
    },
    dropMatchedsprite(matchedsprite) {
      const plmsprite = this.hovered
      this.hovered = null
      if (plmsprite) {
        const url = `sprite/force-match/${plmsprite.id}/${matchedsprite.id}/`
        client.post(url).then(this.completeAutomatch)
      }
    },
    hoverPlmsprite(plmsprite) {
      if (this.dragging) {
        this.hovered = plmsprite
      }
    },
  },
}
</script>
