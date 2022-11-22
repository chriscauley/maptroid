<template>
  <div v-if="ready">
    <h2>Super Metroid Skills</h2>
    <search-bar :filtered_room="filtered_room" />
    <table class="table">
      <thead>
        <td v-if="$auth.user?.is_superuser" />
        <td class="link" @click="showRoomSort">
          Rooms
        </td>
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
            <div v-for="room_id in skill.room_ids" :key="room_id">
              <div :class="room_by_id[room_id].class" @click="filter_room = room_id">
                {{ room_by_id[room_id].name }}
              </div>
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
    <div v-if="$auth.user?.is_superuser">
      <button class="btn -primary" @click="form_name = 'schema/skill'">
        <i class="fa fa-plus" />
        Add New Skill
      </button>
    </div>
    <unrest-modal v-if="form_name" :hide_actions="true" @close="form_name = null">
      <unrest-schema-form :form_name="form_name" @success="success" :ui="ui" />
    </unrest-modal>
  </div>
</template>

<script>
import { markRaw } from 'vue'
import { sortBy } from 'lodash'

import SearchBar from './SearchBar'
import SkillRating from '@/components/SkillRating'
import RoomSearchWidget from '@/components/RoomSearchWidget'
import { bindLocal } from '@/store/local'

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
  components: { SkillRating, SearchBar },
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
      ui: {
        rooms: { tagName: markRaw(RoomSearchWidget) },
      },
    }
  },
  computed: {
    ...bindLocal('skill', ['form_name', 'reversed', 'sorter', 'filter_room', 'search']),
    world() {
      return this.$store.route.world
    },
    rooms() {
      return this.$store.route.world_rooms
    },
    filtered_room() {
      return this.room_by_id[this.filter_room]
    },
    room_by_id() {
      const out = {}
      const zone_by_id = {}
      this.$store.route.zones.forEach((z) => {
        zone_by_id[z.id] = `pill bg-zone -${z.slug} cursor-pointer`
      })
      this.rooms.forEach((r) => {
        out[r.id] = {
          name: r.name,
          class: zone_by_id[r.zone],
        }
      })
      return out
    },
    ready() {
      const { world, rooms } = this
      return world && rooms.length
    },
    skills() {
      const { sorter, reversed, filter_room, search } = this
      const _sorter = (item) => {
        if (sorter === 'difficulty') {
          return difficulties.indexOf(item.difficulty)
        } else if (sorter === 'user level') {
          return this.user_score_by_skill_id[item.id] ?? -1
        }
        return item[sorter]
      }
      let skills = sortBy(this.getSkills(), _sorter)
      if (filter_room) {
        skills = skills.filter((s) => s.room_ids.includes(filter_room))
      }
      if (reversed) {
        skills.reverse()
      }
      if (search) {
        const _s = search.toLowerCase().trim()
        skills = skills.filter((s) => this.skill_text_by_id[s.id]?.includes(_s))
      }
      return skills
    },
    user_score_by_skill_id() {
      const query = { per_page: 0 }
      const items = this.$store.userskill.getPage({ query })?.items || []
      return Object.fromEntries(items.map((us) => [us.skill, us.score]))
    },
    skill_text_by_id() {
      const out = {}
      this.getSkills().forEach((s) => {
        const rooms_text = s.room_ids.map((r) => this.room_by_id[r]?.name || '').join(' ')
        out[s.id] = `${s.name} ${s.description} ${rooms_text}`.toLowerCase()
      })
      return out
    },
  },
  methods: {
    showRoomSort() {
      this.$ui.alert('To filter by room, click on a room name or use the room search.')
    },
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
