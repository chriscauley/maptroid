<template>
  <teleport to="body" v-if="room">
    <unrest-modal @close="$store.local.save({ editing_room: null })" class="edit-room">
      <unrest-toolbar :storage="item_storage" class="-topleft">
        <template #buttons>
          <div :class="invertClass" title="invert" @click="toggleInvert">
            <i class="fa fa-file" />
          </div>
          <unrest-dropdown :items="zone_items" class="btn -info">
            {{ room_zone }}
          </unrest-dropdown>
          <unrest-dropdown :items="png_items" class="btn -info">
            <i class="fa fa-link" />
          </unrest-dropdown>
          <unrest-dropdown class="btn -info" :items="layer_items">
            <i class="fa fa-layer-group" />
            {{ layer }}
          </unrest-dropdown>
        </template>
      </unrest-toolbar>
      <room-box
        :mode="selected.tool"
        :variant="selected.variant"
        :room="room"
        :layer="layer"
        :hide_blocks="hide_blocks"
        :show_bts_extra="show_bts_extra"
      />
      <template #extra_actions>
        <div id="edit-room__actions" />
        {{ room.key }}
        {{ $store.local.state.loading ? '...' : '' }}
        <nav-edit-room icon="fa fa-th-large" :links="overlap_links" />
        <nav-edit-room icon="sm-block -crumble" :links="cre_links" />
      </template>
    </unrest-modal>
  </teleport>
</template>

<script>
import { mod } from '@unrest/geo'
import Mousetrap from '@unrest/vue-mousetrap'
import RoomBox, { plms } from './RoomBox.vue'
import NavEditRoom from './NavEditRoom'
import ToolStorage from '@/components/unrest/ToolStorage'
import link_colors from '@/../../server/static/sm/link_colors.json'
import Item from '@/models/Item'

const Block = {
  weapon: [
    'shot',
    'crumble',
    'bomb',
    'missile',
    'super-missile',
    'power-bomb',
    'speed-booster',
    'grapple_break',
    'grapple',
  ],
  misc: [
    'empty',
    'block',
    'spike_misc',
    'spark',
    'exit',
    'enemy',
    'enemy-break',
    'screw-attack',
    'switch_shot',
    'target',
    'heal',
    'drain',
    'uparrow',
    'downarrow',
    'morph_lock_1',
    'morph_lock_2',
    'morph_lock_3',
  ],
  directional: [
    'spike_up',
    'spike_down',
    'spike_right',
    'spike_left',
    'conveyor_down',
    'conveyor_up',
    'conveyor_right',
    'conveyor_left',
  ],
}

const packs = Item.packs.slice()
const beams = Item.beams.slice()
const abilities = Item.abilities.slice()

const tools = [
  { slug: 'item', variants: packs, icon: (_, v) => `sm-item -${v}` },
  { slug: 'item', variants: beams, icon: (_, v) => `sm-item -${v}` },
  { slug: 'item', variants: abilities, icon: (_, v) => `sm-item -${v}` },
  { slug: 'block', variants: Block.weapon, icon: (_, v) => `sm-block -${v}` },
  { slug: 'block', variants: Block.misc, icon: (_, v) => `sm-block -${v}` },
  { slug: 'block', variants: Block.directional, icon: (_, v) => `sm-block -${v}` },
  { slug: 'plm', variants: Object.keys(plms), icon: (_, v) => `sm-block -${v}` },
  { slug: 'link', variants: Object.keys(link_colors), icon: (_, v) => `maptroid-link -${v}` },
  { slug: 'overlap', icon: 'fa fa-th-large' },
  { slug: 'geometry', icon: 'fa fa-object-group' },
  { slug: 'split', variants: Object.keys(link_colors), icon: (_, v) => `fa fa-chain -${v}` },
]

export default {
  components: { RoomBox, NavEditRoom },
  mixins: [Mousetrap.Mixin],
  inject: ['tool_storage'],
  data() {
    const initial = { selected: { tool: 'item', variant: 'missile' } }
    return {
      item_storage: ToolStorage('tools__sm-item', { tools, initial }),
      layer: 'layer-2+layer-1',
      hide_blocks: false,
      show_bts_extra: false,
    }
  },
  computed: {
    overlap_links() {
      const { overlap_items } = this.tool_storage.state
      if (!overlap_items?.length) {
        return null
      }
      let current_index = overlap_items.findIndex((r) => r.id === this.room.id)
      if (current_index === -1) {
        current_index = 0
      }
      const next = overlap_items[mod(current_index + 1, overlap_items.length)].id
      const prev = overlap_items[mod(current_index - 1, overlap_items.length)].id
      const click = (id) => this.$store.local.save({ editing_room: id })
      return {
        next: () => click(next),
        prev: () => click(prev),
        count: overlap_items.length,
      }
    },
    cre_links() {
      const { cre_items } = this.tool_storage.state
      if (!cre_items?.length) {
        return null
      }
      let current_index = cre_items.findIndex((r) => r.id === this.room.id)
      if (current_index === -1) {
        current_index = 0
      }
      const next = cre_items[mod(current_index + 1, cre_items.length)].id
      const prev = cre_items[mod(current_index - 1, cre_items.length)].id
      const click = (id) => this.$store.local.save({ editing_room: id })
      return {
        next: () => click(next),
        prev: () => click(prev),
        count: cre_items.length,
      }
    },
    mousetrap() {
      return {
        z: {
          keydown: () => (this.hide_blocks = true),
          keyup: () => (this.hide_blocks = false),
        },
        x: () => (this.show_bts_extra = !this.show_bts_extra),
      }
    },
    invertClass() {
      const { invert_layers } = this.room.data
      return ['btn', invert_layers ? '-primary' : '-secondary']
    },
    selected() {
      return this.item_storage.state.selected
    },
    room() {
      const room_id = this.$store.local.state.editing_room
      return room_id && this.$store.route.world_rooms.find((r) => r.id === room_id)
    },
    room_zone() {
      return this.$store.route.all_zones.find((z) => z.id === this.room.zone)?.name
    },
    zone_items() {
      return this.$store.route.all_zones.map((z) => ({
        text: z.name,
        click: () => {
          const room = this.room
          room.zone = z.id
          this.$store.room.save(room)
        },
      }))
    },
    layer_items() {
      return ['layer-2+layer-1', 'layer-1', 'layer-2', 'bts', 'plm_enemies'].map((name) => ({
        click: () => (this.layer = name),
        text: name,
      }))
    },
    png_items() {
      const { key } = this.room
      const world = this.$store.route.world.slug
      const layers = ['layer-1', 'layer-2', 'bts', 'plm_enemies']
      const items = layers.map((layer) => ({
        href: `/media/_maptroid-sink/${world}/${layer}/${key}`,
        text: `smile ${layer}`,
      }))
      layers.push('layer-2+layer-1')
      layers.forEach((layer) =>
        items.push({
          href: `/media/sm_cache/${world}/${layer}/${key}`,
          text: `sm_cache ${layer}`,
        }),
      )
      items.unshift({
        text: 'admin',
        href: `/djadmin/maptroid/room/${this.room.id}/`,
      })
      return items
    },
  },
  methods: {
    toggleInvert() {
      const { room } = this
      if (!room.data.invert_layers) {
        room.data.invert_layers = true
      } else {
        delete room.data.invert_layers
      }
      this.$store.room.save(room)
    },
  },
}
</script>
