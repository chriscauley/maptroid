<template>
  <div class="skill-search">
    <unrest-form :schema="schema" :state="state" @input="doSearch" />
    <div>
      Filter Room:
    </div>
    <div v-if="filtered_room" :class="filtered_room.class" @click="filter_room = null">
      {{ filtered_room.name }}
      <i class="fa fa-close" />
    </div>
    <div v-else class="pill">
      None
    </div>
  </div>
</template>

<script>
import { bindLocal } from '@/store/local'

export default {
  props: {
    filtered_room: Object,
  },
  data() {
    return {
      schema: {
        type: 'object',
        properties: {
          search: {
            type: 'text',
            title: 'Search Skills',
          },
        },
      },
      state: { search: this.$store.local.state.skill__search },
    }
  },
  computed: {
    ...bindLocal('skill', ['form_name', 'reversed', 'sorter', 'filter_room', 'search']),
  },
  methods: {
    doSearch(state) {
      this.search = state.search
    },
  },
}
</script>
