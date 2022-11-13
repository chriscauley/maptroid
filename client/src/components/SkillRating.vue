<template>
  <div :class="`skill-rating -score-${now_score}`" @mouseleave="hover_score = null">
    <span class="_frown" @mouseenter="hover_score = 0" @click="setScore(0)">
      ☹️
    </span>
    <div
      v-for="i_bar in bars"
      :key="i_bar"
      :class="`_bar -s${i_bar}`"
      @mouseenter="hover_score = i_bar"
      @click="setScore(i_bar)"
    />
    <div class="_score">{{ now_score ?? '?' }}</div>
    / 5
  </div>
</template>

<script>
import { getClient } from '@unrest/vue-storage'

export default {
  props: {
    skill: Object,
    score: Number,
  },
  data() {
    return { hover_score: null, temp_score: null }
  },
  computed: {
    now_score() {
      const { hover_score, temp_score, score } = this
      return hover_score ?? temp_score ?? score
    },
    bars() {
      return [1, 2, 3, 4, 5]
    },
  },
  methods: {
    setScore(score) {
      const skill_id = this.skill.id
      const data = { skill_id, score }
      const url = 'save-user-skill/'
      getClient()
        .post(url, data)
        .then(this.refetch)
    },
    refetch() {
      this.$store.userskill.api.markStale()
      this.$store.userskill.getPage({ query: { per_page: 0 } })
    },
  },
}
</script>
