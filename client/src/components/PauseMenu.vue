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
      <div v-if="show === 'map'">Map!</div>
      <div v-if="show === 'inventory'">
        <div
          class="pause-menu__inventory-section"
          v-for="group in inventory_groups"
          :key="group.name"
        >
          <h4>{{ group.name }}</h4>
          <div
            v-for="item in group.items"
            :key="item.name"
            :class="`pause-menu__inventory-row ${item.enabled ? '-enabled' : ''}`"
          >
            <div
              v-if="item.collected"
              class="pause-menu__inventory-row__inner"
              @click="toggle(item)"
            >
              <div class="pause-menu__inventory-toggle" />
              {{ item.short_name }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    game: Object,
  },
  computed: {
    show: {
      get() {
        return this.game.pausemenu.show
      },
      set(value) {
        this.game.pausemenu.show = value // eslint-disable-line
      },
    },
    inventory_groups() {
      return [
        {
          name: 'Beam',
          items: this.game.player.inventory.beam.getItemList(),
        },
        {
          name: 'Boots',
          items: this.game.player.inventory.boots.getItemList(),
        },
      ]
    },
  },
  methods: {
    toggle(item) {
      this.game.player.toggleItem(item)
    },
  },
}
</script>
