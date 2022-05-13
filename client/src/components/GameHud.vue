<template>
  <div class="game-hud">
    <div class="game-hud__etank-box">
      <div v-for="i in etanks.null" :key="i" class="game-hud__etank -null" />
      <div v-for="i in etanks.empty" :key="i" class="game-hud__etank -empty" />
      <div v-for="i in etanks.full" :key="i" class="game-hud__etank -full" />
      <div class="game-hud__etank-count">Energy: {{ etanks.energy }} / {{ etanks.max_energy }}</div>
    </div>
    <div class="game-hud__rtank-box">
      <div v-for="i in rtanks.null" :key="i" class="game-hud__rtank -null" />
      <div v-for="i in rtanks.empty" :key="i" class="game-hud__rtank -empty" />
      <div v-for="i in rtanks.full" :key="i" class="game-hud__rtank -full" />
    </div>
    <div class="game-hud__weapon-box">
      <div v-for="(weapon, i) in weapons" :key="i" class="game-hud__weapon-wrapper">
        <div :class="weapon.border" v-if="weapon.visible">
          <div :class="weapon.icon" />
          <div class="game-hud__weapon-ammo">{{ weapon.ammo }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { range } from 'lodash'
import { ENERGY } from '@/game/constants'

export default {
  props: {
    game: Object,
  },
  computed: {
    etanks() {
      const { energy } = this.game.player.save_state
      const max_tanks = this.game.player.tech['energy-tank']
      const full_tanks = Math.floor(energy / ENERGY.per_pack['energy-tank'])
      return {
        full: range(full_tanks),
        empty: range(max_tanks - full_tanks),
        null: range(ENERGY.total_tanks - max_tanks),
        energy,
        max_energy: this.game.player.getMax('energy-tank'),
      }
    },
    rtanks() {
      const { reserve } = this.game.player.save_state
      const max_tanks = this.game.player.tech['reserve-tank']
      const full_tanks = Math.floor(reserve / ENERGY.per_pack['reserve-tank'])
      return {
        full: range(full_tanks),
        empty: range(max_tanks - full_tanks),
        null: range(ENERGY.total_reserve - max_tanks),
      }
    },
    weapons() {
      const { player } = this.game
      const slugs = ['missile', 'super-missile', 'power-bomb', 'grappling-beam', 'x-ray']
      const entries = slugs.slice(0, 3).map((s) => [s, player.save_state[s]])
      const inventory = Object.fromEntries(entries)
      const active = player.state.active_weapon
      return slugs.map((slug) => ({
        border: ['game-hud__weapon-border', active === slug && '-active'],
        icon: [`game-hud__weapon-icon sm-ui -ui-${slug}`, active === slug && '-active'],
        ammo: inventory[slug],
        visible: player.tech[slug],
      }))
    },
  },
}
</script>
