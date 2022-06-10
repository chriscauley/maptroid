<template>
  <div class="admin-smile-sprite" v-if="plmsprites">
    <div class="admin-smile-sprite__groups btn-group">
      <h3>Unmatched PLM Sprites ({{ plmsprites.length }})</h3>
      <div class="admin-smile-sprite__cards">
        <div
          v-for="sprite in plmsprites"
          :key="sprite.id"
          class="admin-smile-sprite__card"
          @click="(e) => clickPlm(e, sprite)"
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
      <div class="admin-smile-sprite__cards">
        <div
          v-for="sprite in visible_matchedsprites"
          :key="sprite.id"
          class="admin-smile-sprite__card"
          @click="selected_matchedsprite = sprite"
        >
          <div class="admin-smile-sprite__img" :style="`background-image: url('${sprite.url}')`" />
        </div>
      </div>
    </div>

    <plmsprite-form
      v-if="selected_plmsprite"
      :sprite="selected_plmsprite"
      @refetch="refetchAll"
      @close="selected_plmsprite = null"
      @automatch="automatch"
      :category="active_category"
    />
    <matchedsprite-form
      v-if="selected_matchedsprite"
      :id="selected_matchedsprite.id"
      @refetch="refetchAll"
      @close="selected_matchedsprite = null"
    />
  </div>
</template>

<script>
import { sortBy } from 'lodash'
import { getClient } from '@unrest/vue-storage'

import MatchedspriteForm from './MatchedspriteForm.vue'
import PlmspriteForm from './PlmspriteForm.vue'

export default {
  components: { MatchedspriteForm, PlmspriteForm },
  __route: {
    path: '/app/assign-sprite/',
  },
  data() {
    return {
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
      return sortBy(sprites, 'short_code')
    },
  },
  methods: {
    setCategory(category) {
      this.$router.replace({ query: { ...this.$route.query, category } })
    },
    pprint(sprite) {
      return JSON.stringify(sprite, null, 2)
    },
    refetchAll() {
      this.$store.plmsprite.api.markStale()
      this.$store.matchedsprite.api.markStale()
      this.getPlmsprites()
      this.getMatchedsprites()
    },
    getPlmsprites() {
      const query = { per_page: 500, matchedsprite__isnull: true }
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
      const post = getClient().post(`sprite/automatch/${sprite.id}/`)
      post.then((result) => {
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
        this.refetchAll()
        this.selected_plmsprite = null
      })
    },
  },
}
</script>
