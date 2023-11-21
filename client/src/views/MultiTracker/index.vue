<template>
  <div class="multi-tracker">
    <unrest-modal v-if="modal" :hide_actions="true" @close="modal = null">
      <component :is="modal" :controller="controller" @close="modal = null" />
    </unrest-modal>
    <div class="multi-tracker__grids">
      <div v-for="player in visible_players" :key="player.index">
        <sm-grid-tracker
          class="-no-chrome"
          mode="cwisp"
          :inventory="player.inventory"
          :objectives="getPlayerObjectives(player)"
          :objective_order="player.objective_order"
          @add-item="(item, amount) => addItem(player, item, amount)"
          @toggle-item="(item) => toggleItem(player, item)"
          @toggle-objective="(objective) => toggleObjective(player, objective)"
        />
      </div>
    </div>
    <div class="unrest-floating-actions">
      <div class="btn-group">
        <button v-for="button in buttons" :key="button.attrs.id" v-bind="button.attrs">
          <i :class="button.icon" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import Controller from './Controller'
import ObjectiveSelector from './ObjectiveSelector.vue'
import PasswordForm from './PasswordForm.vue'
import ResetRoom from './ResetRoom.vue'
import SettingsForm from './SettingsForm.vue'

const resetPlayers = () =>
  [0, 1, 2, 3].map((index) => ({
    index,
    inventory: {},
    objectives: {},
    objective_order: [],
  }))

export default {
  __route: {
    name: 'multi-tracker',
    path: '/app/multi-tracker/:slug/',
  },
  components: { ObjectiveSelector, PasswordForm, ResetRoom, SettingsForm },
  data() {
    return {
      modal: null,
      poll_timeout: null,
      controller: Controller(this.$route.params.slug, this),
      action_index: 0,
      players: resetPlayers(),
    }
  },
  computed: {
    hash() {
      // triggers a reload of the players state when the id changes
      return this.controller.get()?.id
    },
    visible_players() {
      if (this.$route.query.index) {
        const player_index = parseInt(this.$route.query.index, 10)
        return this.players.filter((p) => p.index === player_index)
      }
      return this.players
    },
    actions() {
      return this.controller.get()?.data.actions
    },
    buttons() {
      const { controller } = this
      if (!controller.hasPassword()) {
        return [
          {
            icon: 'fa fa-lock',
            attrs: {
              class: 'btn -danger',
              title: 'Locked',
              onClick: () => (this.modal = 'password-form'),
            },
          },
        ]
      }
      return [
        {
          icon: 'fa fa-refresh',
          attrs: {
            class: 'btn -danger',
            title: 'Reset Room',
            onClick: () => (this.modal = 'reset-room'),
          },
        },
        // {
        //   icon: 'fa fa-user',
        //   attrs: {
        //     class: 'btn -primary',
        //     title: 'Edit Users',
        //     onClick: () => (this.modal = 'users-popup'),
        //   },
        // },
        {
          icon: 'fa fa-list-ol',
          attrs: {
            class: 'btn -primary',
            title: 'Edit Objectives',
            onClick: () => (this.modal = 'objective-selector'),
          },
        },
        // {
        //   icon: 'fa fa-gear',
        //   attrs: {
        //     class: 'btn -primary',
        //     title: 'Unlocked',
        //     onClick: () => (this.modal = 'settings-form'),
        //   },
        // },
      ]
    },
  },
  watch: {
    hash: function() {
      this.action_index = 0
      this.players = resetPlayers()
    },
    actions: function() {
      this.actions?.slice(this.action_index).forEach(([type, index, key, value]) => {
        const player = this.players[index]
        if (type === 'objectives' || type === 'inventory') {
          player[type][key] = value
        }
        if (type === 'objectives') {
          // objective order has to be manually controlled because page needs to be refreshable
          if (!value) {
            player.objective_order = player.objective_order.filter((o) => o !== key)
          } else if (!player.objective_order.includes(key)) {
            player.objective_order.push(key)
          }
        }
        this.action_index += 1
      })
    },
  },
  mounted() {
    this.tick()
  },
  unmounted() {
    clearTimeout(this.poll_timeout)
  },
  methods: {
    stop() {
      clearTimeout(this.poll_timeout)
      this.poll_timeout = null
    },
    tick() {
      this.poll_timeout = setTimeout(() => {
        this.controller.markStale()
        this.tick()
      }, 5000)
    },
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
    getPlayerObjectives(player) {
      const { objectives } = this.controller.get()?.data || {}
      if (!objectives) {
        return {}
      }
      return Object.fromEntries(objectives.map((o) => [o, !!player.objectives[o]]))
    },
  },
}
</script>
