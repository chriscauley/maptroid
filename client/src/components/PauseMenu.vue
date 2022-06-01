<template>
  <div class="modal">
    <div class="modal-mask" />
    <div class="pause-menu modal-content">
      <div class="pause-menu__nav">
        <button class="pause-menu__nav-button -left" @click="show = 'map'">
          <div class="pause-menu__trigger">L</div>
          Map
        </button>
        <button class="pause-menu__nav-button -right" @click="show = 'inventory'">
          <div class="pause-menu__trigger">R</div>
          Inventory
        </button>
      </div>
      <div v-if="show === 'map'" class="pause-menu__inventory -map">
        <div v-for="zone in zones" :key="zone.id" class="pause-menu__inventory-section">
          <h4>{{ zone.name }}</h4>
          <button
            v-for="room in zone.save_rooms"
            :key="room.id"
            @click="warpTo(room)"
            tabindex="1"
            class="pause-menu__inventory-row"
          >
            {{ room.name }}
          </button>
        </div>
      </div>
      <div v-if="show === 'inventory'" class="pause-menu__inventory">
        <div class="pause-menu__inventory-section -supply">
          <h4>Supply</h4>
          <div :class="reserve.slots ? '' : '_hidden'">
            <button @click="reserve.toggle">Mode [{{ reserve.mode }}]</button>
            <button>
              Reserve Tank
            </button>
            <div class="pause-menu__reserve-tanks__wrapper">
              <div class="pause-menu__reserve-tanks">
                <div v-for="(tank, i) in reserve.classes" :class="tank" :key="i" />
                <div class="_pink-bar" :style="reserve.pink_style" />
              </div>
              {{ game.player.save_state.reserve }}
            </div>
          </div>
        </div>
        <div
          class="pause-menu__inventory-section"
          v-for="group in inventory_groups"
          :key="group.name"
        >
          <h4>{{ group.name }}</h4>
          <button
            v-for="item in group.items"
            :key="item.name"
            :class="`pause-menu__inventory-row ${item.enabled ? '-enabled' : ''}`"
            @click="toggle(item)"
          >
            <div v-if="item.collected" class="pause-menu__inventory-row__inner">
              <div class="pause-menu__inventory-toggle" />
              {{ item.short_name }}
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { startCase, range } from 'lodash'
import Mousetrap from '@unrest/vue-mousetrap'
import { mod } from '@unrest/geo'

export default {
  mixins: [Mousetrap.Mixin],
  props: {
    game: Object,
  },
  data() {
    return {
      last_focused: null,
    }
  },
  computed: {
    mousetrap() {
      return {
        up: () => this.shiftFocus('dx', -1),
        down: () => this.shiftFocus('dx', 1),
        left: () => this.shiftFocus('dy', -1),
        right: () => this.shiftFocus('dy', 1),
        x: () => this.last_focused?.click(),
      }
    },
    show: {
      get() {
        return this.game.pausemenu.show
      },
      set(value) {
        this.game.pausemenu.show = value // eslint-disable-line
      },
    },
    inventory_groups() {
      const slugs = ['beam', 'suit', 'misc', 'boots']
      return slugs.map((slug) => ({
        name: startCase(slug),
        items: this.game.player.inventory[slug].getItemList(),
      }))
    },
    zones() {
      return this.$store.route.zones.map((zone) => {
        const rooms = this.game.world_controller.rooms.filter((r) => r.json.zone === zone.id)
        return {
          name: zone.name,
          id: zone.id,
          save_rooms: rooms
            .filter((r) => r.save_station)
            .map((r) => ({
              id: r.id,
              name: r.json.name?.replace('Save Room', '') || r.id,
            })),
        }
      })
    },
    reserve() {
      const count = this.game.player.tech['reserve-tank']
      const slots = Math.max(4, count)
      const max = 100 * slots
      const { reserve } = this.game.player.save_state
      return {
        classes: range(slots).map((i) => [i < count && '-exists', '_tank']),
        pink_style: `width: ${(100 * reserve) / max}%`,
        mode: this.game.player.save_state.auto_reserve ? 'auto' : 'manual',
      }
    },
  },
  mounted() {
    this.focusElement(this.$el.querySelector('button'))
    this.game.pause_menu_element = this // eslint-disable-line
  },
  updated() {
    this.last_focused.classList.add('-focused')
  },
  methods: {
    focusElement(element) {
      this.last_focused = element
      this.$el.querySelector('.-focused')?.classList.remove('-focused')
      element.classList.add('-focused')
    },
    toggle(item) {
      this.game.player.toggleItem(item)
    },
    warpTo({ id }) {
      this.game.togglePause()
      this.game.warp(id)
    },
    pressButton(button) {
      if (button === 'jump') {
        button = 'x'
      }
      this.mousetrap[button]?.()
    },
    shiftFocus(axis, dindex) {
      let buttons = this._getButtons()

      // remove "on axis" buttons (buttons in same column or row, hwen targeting the inverse)
      const alt_axis = axis === 'dx' ? 'dy' : 'dx'
      buttons = buttons.filter((b) => b.current || b[alt_axis] > 10)

      let matched_buttons = []
      let delta = 10
      while (delta < 200 && matched_buttons.length <= 1) {
        matched_buttons = buttons.filter((b) => Math.abs(b[axis]) < delta)
        delta += 10
      }

      const index = matched_buttons.findIndex((b) => b.current) + dindex
      const target = matched_buttons[mod(index, matched_buttons.length)]
      if (target?.element) {
        this.focusElement(target.element)
      }
    },
    _getButtons() {
      const buttons = [...this.$el.querySelectorAll('button')].map((element) => {
        const box = element.getBoundingClientRect()
        box.element = element
        box.current = element === this.last_focused
        return box
      })
      buttons.forEach((b) => {
        b.center = [b.x + b.width / 2, b.y + b.height / 2]
      })

      const current = buttons.find((b) => b.current)
      buttons.forEach((b) => {
        b.dx = Math.abs(current.center[0] - b.center[0])
        b.dy = Math.abs(current.center[1] - b.center[1])
      })
      return buttons
    },
  },
}
</script>
