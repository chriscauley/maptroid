<template>
  <unrest-modal>
    <div v-for="group in groups" class="dread-group" :key="group">
      <div :class="`dread-group__circle -group-${group}`" />
      #{{ group }} x {{ countGroup(group) }}
    </div>
    <div>
      Show only
      <select v-model="selected_limit">
        <option v-for="limit in limits" :key="limit">{{ limit }}</option>
      </select>
      <template v-if="selected_limit">
        from the
        <a
          v-for="direction in directions"
          :key="direction"
          :href="`?limit=${selected_limit}&sort_from=${direction}`"
        >
          {{ direction + ' ' }}
        </a>
      </template>
    </div>
    <div>
      Merge group
      <select v-model="merge">
        <option value="">??</option>
        <option v-for="group in groups" :key="group" :value="group"># {{ group }}</option>
      </select>
      into group
      <select v-model="keep">
        <option value="">??</option>
        <option v-for="group in groups" :key="group" :value="group"># {{ group }}</option>
      </select>
    </div>
    <template #actions>
      <div v-if="keep !== undefined && merge !== undefined">
        Merge group of {{ countGroup(merge) }} items?
        <div class="btn -danger" @click="confirmMerge">Yes</div>
      </div>
    </template>
  </unrest-modal>
</template>

<script>
import { range } from 'lodash'

export default {
  props: {
    osd_store: Object,
  },
  data() {
    return {
      keep: undefined,
      merge: undefined,
      selected_limit: undefined,
      groups: range(9),
      limits: [10, 50, 100, 150, 200, 300, 400],
      directions: ['left', 'right', 'top', 'bottom'],
    }
  },
  computed: {
    screenshots() {
      return this.osd_store.state.screenshots
    },
  },
  methods: {
    countGroup(group) {
      return this.screenshots.filter((s) => (s.data.zone.group || 0) === group).length
    },
    confirmMerge() {
      const screenshots = this.screenshots.filter((s) => (s.data.zone?.group || 0) === this.merge)
      Promise.all(
        screenshots.map((screenshot) => {
          screenshot.data.zone.group = this.keep
          return this.$store.screenshot.save(screenshot)
        }),
      ).then(() => {
        this.keep = this.merge = undefined
      })
    },
  },
}
</script>
