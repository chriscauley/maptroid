<template>
  <div v-if="ready">
    <h2>Super Metroid Skills</h2>
    <table class="table">
      <thead>
        <td />
        <td v-for="column in columns" :key="column" @click="setSorter(column)" class="link">
          {{ column }}
          <i :class="css.sort(column)" />
        </td>
      </thead>
      <tbody>
        <tr v-for="skill in skills" :key="skill.id" class="card skill-list__skill">
          <td v-if="$auth.user?.is_superuser">
            <div :class="css.edit(skill)" @click="form_name = `schema/skill/${skill.id}`">
              <i class="fa fa-edit" />
            </div>
          </td>
          <td>
            {{ skill.name }}
          </td>
          <td>
            <skill-rating :skill="skill" :score="user_score_by_skill_id[skill.id]" />
          </td>
          <td>
            <span :class="css.pill(skill)">{{ skill.difficulty }}</span>
          </td>
        </tr>
      </tbody>
    </table>
    <button class="btn -primary" @click="form_name = 'schema/skill'">
      <i class="fa fa-plus" />
      Add New Skill
    </button>
    <unrest-modal v-if="form_name" :hide_actions="true" @close="form_name = null">
      <unrest-schema-form :form_name="form_name" @success="success" :ui="ui" />
    </unrest-modal>
  </div>
</template>

<script>
import { markRaw } from 'vue'
import { sortBy } from 'lodash'

import SkillRating from '@/components/SkillRating'
import RoomSearchWidget from '@/components/RoomSearchWidget'

const difficulty_colors = {
  noob: 'primary',
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'error',
  master: 'light -master',
}

const difficulties = Object.keys(difficulty_colors)

export default {
  __route: {
    path: '/app/skill/:world_slug/',
  },
  components: { SkillRating },
  data() {
    const columns = ['Name', 'User Level', 'Difficulty']
    return {
      css: {
        edit: (skill) => `btn -${skill.room_ids?.length ? 'primary' : 'warning'}`,
        pill: (skill) => `pill pill-${difficulty_colors[skill.difficulty]}`,
        sort: (name) => {
          const slug = name.toLowerCase()
          if (this.sorter === slug) {
            return `fa fa-caret-${this.reversed ? 'up' : 'down'}`
          }
          return ''
        },
      },
      columns,
      form_name: null,
      sorter: 'name',
      reversed: false,
      ui: {
        rooms: { tagName: markRaw(RoomSearchWidget) },
      },
    }
  },
  computed: {
    world() {
      return this.$store.route.world
    },
    rooms() {
      return this.$store.route.world_rooms
    },
    ready() {
      const { world, rooms } = this
      return world && rooms.length
    },
    skills() {
      const sorter = (item) => {
        if (this.sorter === 'difficulty') {
          return difficulties.indexOf(item.difficulty)
        }
        return item[this.sorter]
      }
      const skills = sortBy(this.getSkills(), sorter)
      if (this.reversed) {
        skills.reverse()
      }
      return skills
    },
    user_score_by_skill_id() {
      const query = { per_page: 0 }
      const items = this.$store.userskill.getPage({query})?.items || []
      console.log(Object.fromEntries(items.map(us => [us.skill, us.score])))
      return Object.fromEntries(items.map(us => [us.skill, us.score]))
    },
  },
  methods: {
    getSkills() {
      const query = {
        per_page: 0,
        world__slug: this.$route.params.world_slug,
      }
      return this.$store.skill.getPage({ query })?.items || []
    },
    success() {
      this.$store.skill.api.markStale()
      this.getSkills()
      this.$ui.toast.success('Skill Added')
      this.form_name = null
    },
    setSorter(name) {
      const slug = name.toLowerCase()
      if (this.sorter === slug && !this.reversed) {
        this.reversed = true
      } else {
        this.sorter = slug
        this.reversed = false
      }
    },
  },
}
</script>
