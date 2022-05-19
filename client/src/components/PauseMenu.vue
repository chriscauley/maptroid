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
      <div v-if="show === 'map'">
        <div v-for="zone in zones" :key="zone.id" class="pause-menu__inventory-section">
          <h4>{{ zone.name }}</h4>
          <div v-for="room in zone.save_rooms" @click="warpTo(room)" :key="room.id" tabindex="1">
            {{ room.name }}
          </div>
        </div>
      </div>
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
              name: r.json.name?.replace('Save Station', '') || r.id,
            })),
        }
      })
    },
  },
  methods: {
    toggle(item) {
      this.game.player.toggleItem(item)
    },
    warpTo({ id }) {
      this.game.togglePause()
      this.game.warp(id)
    },
  },
}
</script>
