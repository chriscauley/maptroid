<template>
  <div class="list-group run-list">
    <div class="list-group-item">
      <unrest-dropdown :items="run_items">
        <div class="btn -info">
          {{ current_run?.id || 'Select a run' }}
        </div>
      </unrest-dropdown>
      <div v-if="running" class="btn -primary" @click="stopRun">
        <i class="fa fa-stop" />
      </div>
      <div v-else class="btn -secondary" @click="startRun">
        <i class="fa fa-play" />
      </div>
    </div>
    <div class="run-list__scroll" ref="scroll">
      <template v-for="(action, i) in actions" :key="i">
        <div class="list-group-item" @click="indexAfter(i)">
          <i :class="action.class" />
          <div class="flex-grow truncate">
            {{ action.title }}
          </div>
        </div>
        <div v-if="i === $store.local.state.insert_run_action_after" class="list-group-item">
          <i class="fa fa-chevron-right" />
          <i class="fa fa-chevron-right" />
          <span class="flex-grow">Insert here!</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
const MISSING_ITEM = { title: '?? Item missing' }

export default {
  data() {
    return { running: false }
  },
  computed: {
    current_run() {
      return this.$store.run.getCurrentRun()
    },
    actions() {
      const { actions = [] } = this.current_run?.data || {}
      return actions.map(this.prepAction)
    },
    run_items() {
      const items = this.$store.route.world_runs?.map((run) => ({
        text: run.id,
        click: () => this.$store.local.save({ current_run_id: run.id }),
      }))
      items.push({
        text: 'New Run',
        click: () => this.$store.run.startNewRun(),
      })
      return items
    },
    items_by_id() {
      const map = {}
      this.$store.route.world_items.forEach((i) => (map[i.id] = i))
      return map
    },
  },
  methods: {
    indexAfter(index) {
      this.$store.local.save({ insert_run_action_after: index })
    },
    prepAction(action) {
      if (action[0] === 'item') {
        return this.items_by_id[action[1]]?.attrs || MISSING_ITEM
      } else if (action[0] === 'room_xy') {
        return {
          title: `Room #${action[1]} @${action[2]}`,
        }
      }
      return MISSING_ITEM
    },
    startRun() {
      const { insert_run_action_after } = this.$store.local.state
      if (!insert_run_action_after) {
        this.$store.local.save({ insert_run_action_after: 0 })
      }
      this.running = setInterval(this.step, 250)
    },
    stopRun() {
      clearInterval(this.running)
      this.running = null
    },
    step() {
      const { insert_run_action_after } = this.$store.local.state
      this.$refs.scroll.children[insert_run_action_after].scrollIntoView()
      this.$store.local.save({ insert_run_action_after: insert_run_action_after + 1 })
    },
  },
}
</script>
