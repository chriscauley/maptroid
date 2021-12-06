<template>
  <div :class="wrapper_class" v-if="ready">
    <base-viewer :osd_store="osd_store" @viewer-bound="loadImages" @click="click" />
    <template v-if="osd_store.viewer">
      <unrest-toolbar :storage="tool_storage" class="-topleft">
        <config-popper v-if="tool_storage.state.settings_open" :storage="tool_storage" />
        <template #buttons>
          <unrest-dropdown class="btn -primary" v-if="overlap_items.length" :items="overlap_items">
            <i class="fa fa danger" />
          </unrest-dropdown>
        </template>
      </unrest-toolbar>
      <html-overlay :viewer="osd_store.viewer">
        <template v-if="$store.route.zone">
          <room-box
            v-for="room in $store.route.zone_rooms"
            :key="room.id"
            :room="room"
            mode="arrange"
          />
        </template>
        <template v-else>
          <zone-box v-for="zone in zones" :key="zone.id" :zone="zone" />
        </template>
        <div v-for="(e, i) in elevators" :key="i" v-bind="e" />
        <svg-overlay :map_props="map_props" />
        <item-overlay :map_props="map_props" v-if="tool_storage.state.show_items" />
      </html-overlay>
    </template>
    <item-list v-if="items.length" :items="items" />
    <edit-room />
  </div>
</template>

<script>
import Openseadragon from 'openseadragon'
import { computed } from 'vue'
import { sortBy } from 'lodash'

import BaseViewer from '@/components/BaseViewer'
import ConfigPopper from './ConfigPopper.vue'
import HtmlOverlay from '@/vue-openseadragon/HtmlOverlay.vue'
import ItemList from '@/components/ItemList.vue'
import ItemOverlay from './ItemOverlay.vue'
import OsdStore from './OsdStore'
import EditRoom from './EditRoom.vue'
import prepItem from './prepItem'
import SvgOverlay from './SvgOverlay.vue'
import RoomBox from './RoomBox.vue'
import ToolStorage from './ToolStorage'
import ZoneBox from './ZoneBox.vue'

const { Rect } = Openseadragon

export default {
  __route: {
    path: '/sm/:world_slug/:zone_slug?/',
  },
  components: {
    BaseViewer,
    ConfigPopper,
    HtmlOverlay,
    ItemList,
    ItemOverlay,
    EditRoom,
    SvgOverlay,
    RoomBox,
    ZoneBox,
  },
  provide() {
    return {
      video: () => null, // TODO deprecated in favor of $store.local and $store.route
      osd_store: computed(() => this.osd_store), // TODO osd_storage, not osd_store
      tool_storage: computed(() => this.tool_storage),
    }
  },
  data() {
    const osd_store = OsdStore(this)
    const tool_storage = ToolStorage(this)
    return { osd_store, tool_storage }
  },
  computed: {
    is_world() {
      return !this.$route.params.zone_slug
    },
    map_props() {
      const map_bounds = [0, 0, 0, 0]
      const zone_offsets = {}

      let zones = this.$store.route.zones
      let items
      if (this.$route.params.zone_slug) {
        items = this.$store.route.zone_items
        const { zone } = this.$store.route
        zones = [zone]
        const [_x, _y, width, height] = zone.data.world.bounds
        map_bounds[2] = width
        map_bounds[3] = height
        zone_offsets[zone.id] = [0, 0]
      } else {
        items = this.$store.route.world_items
        zones = zones.filter((z) => !z.data.hidden)
        zones.forEach((zone) => {
          const [x, y, width, height] = zone.data.world.bounds
          map_bounds[2] = Math.max(width + x, map_bounds[2])
          map_bounds[3] = Math.max(height + y, map_bounds[3])
          zone_offsets[zone.id] = [x, y]
        })
      }

      const rooms = this.$store.route.world_rooms.filter((r) => zone_offsets[r.zone])
      const room_offsets = {}
      rooms.forEach((r) => {
        const [zone_x, zone_y] = zone_offsets[r.zone]
        const [x, y] = r.data.zone.bounds.slice(0, 2)
        room_offsets[r.id] = [zone_x + x, zone_y + y]
      })

      return { map_bounds, zones, rooms, zone_offsets, room_offsets, items }
    },
    ready() {
      const { world, world_rooms } = this.$store.route
      return world && this.zones.length && world_rooms.length
    },
    items() {
      const { zone, zone_items, world_items } = this.$store.route
      return (zone ? zone_items : world_items).map((item) => ({
        ...item,
        ...prepItem(item),
      }))
    },
    zones() {
      return this.$store.route.zones.filter((z) => !z.data.hidden)
    },
    wrapper_class() {
      const zoom = Math.round(this.osd_store.state.zoom)
      const { tool, variant } = this.tool_storage.state.selected
      const layers = this.tool_storage.getVisibleLayers()
      return [
        'app-body -full-screen',
        `-zoom-${zoom} -tool-${tool} -variant-${variant}`,
        layers.map((l) => `-layer-${l}`),
      ]
    },
    elevators() {
      if (!this.tool_storage.state['show_layer-1'] || !this.is_world) {
        return []
      }
      const { elevators = {} } = this.$store.route.world.data
      return Object.entries(elevators).map(([xy, variant]) => {
        const [x, y] = xy.split(',').map((i) => parseInt(i))
        return {
          class: `sm-elevator -${variant}`,
          style: {
            left: `${x * 100}%`,
            top: `${y * 100}%`,
            position: 'absolute',
            width: '100%',
            height: '100%',
          },
        }
      })
    },
    overlap_items() {
      if (this.tool_storage.state.selected.tool !== 'edit_room') {
        return []
      }
      const { rooms } = this.map_props

      // How many times does an zone_xy appear in each room?
      const xy_map = {}
      rooms.forEach((r) => {
        const [x0, y0, width, height] = r.data.zone.bounds
        for (let dx = 0; dx < width; dx++) {
          const x = x0 + dx
          for (let dy = 0; dy < height; dy++) {
            const y = y0 + dy
            if (!r.data.holes.find((hole) => dx === hole[0] && dy === hole[1])) {
              const xy = [x, y]
              xy_map[xy] = xy_map[xy] || []
              xy_map[xy].push(r.id)
            }
          }
        }
      })

      // Filter out the xys with one room, and then figure out how many times each room appears
      const room_counts = {}
      const binRoomIds = (room_ids) =>
        room_ids.forEach((id) => (room_counts[id] = (room_counts[id] || 0) + 1))
      Object.values(xy_map)
        .filter((i) => i.length > 1)
        .forEach(binRoomIds)

      // Create items for each room to appear in dropdown
      const items = Object.entries(room_counts).map(([room_id, count]) => {
        const room = rooms.find((r) => r.id === parseInt(room_id))
        return {
          count,
          text: `${count} #${room_id} ${room.name || room.data.zone.bounds}`,
          click: () => this.$store.local.save({ editing_room: room.id }),
        }
      })

      return sortBy(items, 'count').reverse()
    },
  },
  watch: {
    'tool_storage.state.show_bts': 'syncImages',
    'tool_storage.state.show_layer-1': 'syncImages',
  },
  methods: {
    click(event) {
      const { selected } = this.tool_storage.state
      if (selected.tool === 'elevator') {
        const xy = this.osd_store.getWorldXY(event)
        const { world } = this.$store.route
        if (!world.data.elevators) {
          world.data.elevators = {}
        }
        if (event.shiftKey) {
          delete world.data.elevators[xy]
        } else {
          world.data.elevators[xy] = selected.variant
        }
        this.$store.world2.save(world).then(this.$store.route.refetchWorlds)
      }
    },
    loadImages() {
      let x_max = 10
      let y_max = 10
      const { zone, zone_rooms } = this.$store.route
      if (zone) {
        zone_rooms.forEach((room) => {
          const [x, y, width, height] = room.data.zone.bounds
          x_max = Math.max(x_max, x + width)
          y_max = Math.max(y_max, y + height)
        })
      } else {
        this.zones.forEach((zone) => {
          const [x, y, width, height] = zone.data.world.bounds

          let tileSource = zone.data.dzi
          this.osd_store.viewer.addTiledImage({ tileSource, width: width, x, y })

          tileSource = zone.data.bts_dzi
          this.osd_store.viewer.addTiledImage({ tileSource, width: width, x, y })
          x_max = Math.max(x_max, x + width)
          y_max = Math.max(y_max, y + height)
        })
      }
      this.osd_store.viewer.addOnceHandler('tile-loaded', () => {
        this.osd_store.viewer.viewport.fitBounds(new Rect(0, 0, x_max, y_max), true),
          this.syncImages()
      })
      this.loadCorners(x_max, y_max)
    },
    loadCorners(x_max, y_max) {
      x_max -= 1
      y_max -= 1
      const url = '/static/corner_64.png'
      const corners = [
        [0, 0, 0],
        [0, y_max, 270],
        [x_max, y_max, 180],
        [x_max, 0, 90],
      ]
      corners.forEach(([x, y, degrees]) => {
        this.osd_store.viewer.addSimpleImage({ url, x, y, width: 1, opacity: 1, degrees })
      })
    },
    syncImages() {
      const world_re = new RegExp(`/media/sm_zone/${this.$route.params.world_slug}/`)
      this.osd_store.viewer.world._items.forEach((i) => {
        const url = i.source.tilesUrl || ''
        if (url.match(world_re)) {
          const layer = url.includes('/bts/') ? 'bts' : 'layer-1'
          const opacity = this.tool_storage.state[`show_${layer}`] ? 1 : 0
          i.setOpacity(opacity)
        }
      })
    },
  },
}
</script>
