<template>
  <div class="multi-tracker">
    <unrest-modal v-if="show_password" :hide_actions="true">
      <form @submit.prevent="savePassword">
        Enter password:
        <div class="form-group">
          <input type="text" class="form-control" ref="password" />
        </div>
        <div class="multi-tracker__buttons">
          <button class="btn -secondary" type="button" @click="show_password=false" tabIndex="-1">Cancel</button>
          <button class="btn -primary">Set Password</button>
        </div>
      </form>
    </unrest-modal>
    <div class="multi-tracker__grids">
      <div v-for="player in players" :key="player.index">
        <sm-grid-tracker
          class="-no-grid"
          mode="cwisp"
          :inventory="player.inventory"
          :objectives="player.objectives.length && player.objectives"
          :objective_order="player.objective_order"
          @add-item="(item, amount) => addItem(player, item, amount)"
          @toggle-item="(item) => toggleItem(player, item)"
          @toggle-objective="(objective) => toggleObjective(player, objective)"
        />
      </div>
    </div>
</div>
</template>

<script>
import MultiTracker from '@/store/MultiTracker'

export default {
  __route: {
    name: 'multi-tracker',
    path: '/app/multi-tracker/:slug/',
  },
  watch: {
    'actions.length': function () {
      this.actions?.slice(this.action_index).forEach(([type, index, key, value]) => {
        const player = this.players[index]
        if (type === 'objectives' || type === 'inventory') {
          player[type][key] = value
        }
        if (type === 'objectives') {
          // objective order has to be manually controlled because page needs to be refreshable
          if (!value) {
            player.objective_order = player.objective_order.filter(o => o !== key)
          } else if (!player.objective_order.includes(key)) {
            player.objective_order.push(key)
          }
        }
        this.action_index += 1
      })
    },
  },
  data() {
    return {
      show_password: false,
      controller: MultiTracker(this.$route.params.slug, this),
      action_index: 0,
      players: [0, 1, 2, 3].map((index) => ({
        index,
        inventory: {},
        objectives: {},
        objective_order: [],
      }))
    }
  },
  computed: {
    actions() {
      return this.controller.get()?.actions
    },
  },
  methods: {
    // toggleItem(player, item) {
    //   this.actions.push(['inventory', player.index, item, !player.inventory[item]])
    // },
    // addItem(player, item, amount) {
    //   const value = player.inventory[item] || 0
    //   this.actions.push(['inventory', player.index, item, value + amount])
    // },
    // toggleObjective(player, objective) {
    //   const value = player.objectives[objective]
    //   this.actions.push(['objectives', player.index, objective, !value])
    // },
    toggleItem(player, item) {
      const value = !player.inventory[item]
      this.controller.addAction(['inventory', player.index, item, value])
    },
    addItem(player, item, amount) {
      const value = player.inventory[item] || 0
      this.controller.addAction(['inventory', player.index, item, value + amount])
    },
    toggleObjective(player, objective) {
      const value = player.objectives[objective]
      this.controller.addAction(['objectives', player.index, objective, !value])
    },
    savePassword(e) {
      console.log(this.$refs.password.value)
    },
  }
}
</script>