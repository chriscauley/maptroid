<template>
  <div :class="wrapper_class" v-if="ready">
    <base-viewer :osd_store="osd_store" @viewer-bound="loadImages" />
    <template v-if="osd_store.viewer">
      <unrest-toolbar :storage="tool_storage" class="-topleft">
        <config-popper v-if="tool_storage.state.settings_open" :storage="tool_storage" />
        <template #buttons>
          <overlap-dropdown />
          <cre-dropdown @highlight="(h) => (highlighted_rooms = h)" />
          <rezone-dropdown :storage="tool_storage" />
          <mc-dropdown />
        </template>
      </unrest-toolbar>
      <html-overlay :viewer="osd_store.viewer">
        <template v-if="$store.route.zone">
          <room-box
            v-for="room in $store.route.zone_rooms"
            :key="room.id"
            :room="room"
            mode="arrange"
            :highlight="highlighted_rooms.includes(room.id)"
          />
        </template>
        <template v-else>
          <zone-box v-for="zone in zones" :key="zone.id" :zone="zone" />
        </template>
        <svg-overlay :highlighted_rooms="highlighted_rooms" :storage="tool_storage" />
        <item-overlay v-if="tool_storage.state.show_items" />
        <link-overlay v-if="tool_storage.state.show_links" />
        <elevator-overlay v-if="tool_storage.state.show_links" />
      </html-overlay>
    </template>
    <viewer-panel :items="visible_items" :tool="tool_storage.state.selected.tool" />
    <video-player v-if="show_player" />
    <edit-room />
  </div>
</template>

<script>
import { clamp } from 'lodash'
import Openseadragon from 'openseadragon'
import { computed } from 'vue'

import BaseViewer from '@/components/BaseViewer'
import CreDropdown from './CreDropdown.vue'
import ConfigPopper, { DZI_LAYERS } from './ConfigPopper.vue'
import ElevatorOverlay from './ElevatorOverlay.vue'
import HtmlOverlay from '@/vue-openseadragon/HtmlOverlay.vue'
import ViewerPanel from '@/components/ViewerPanel/index.vue'
import ItemMixin from '@/store/ItemMixin'
import ItemOverlay from './ItemOverlay.vue'
import LinkOverlay from './LinkOverlay.vue'
import McDropdown from './McDropdown.vue'
import OsdStore from './OsdStore'
import OverlapDropdown from './OverlapDropdown.vue'
import EditRoom from './EditRoom.vue'
import SvgOverlay from './SvgOverlay.vue'
import RezoneDropdown from './RezoneDropdown.vue'
import RoomBox from './RoomBox.vue'
import ToolStorage from './ToolStorage'
import ZoneBox from './ZoneBox.vue'

const { Rect } = Openseadragon

export default {
  __route: {
    name: 'map_viewer',
    path: '/sm/:world_slug/:zone_slug?/',
  },
  components: {
    BaseViewer,
    CreDropdown,
    ConfigPopper,
    HtmlOverlay,
    ViewerPanel,
    ItemOverlay,
    ElevatorOverlay,
    EditRoom,
    LinkOverlay,
    McDropdown,
    OverlapDropdown,
    SvgOverlay,
    RezoneDropdown,
    RoomBox,
    ZoneBox,
  },
  mixins: [ItemMixin],
  provide() {
    return {
      osd_store: computed(() => this.osd_store), // TODO osd_storage, not osd_store
      tool_storage: computed(() => this.tool_storage),
      map_props: computed(() => this.map_props),
    }
  },
  data() {
    return {
      osd_store: OsdStore(this),
      tool_storage: ToolStorage(this),
      highlighted_rooms: [],
    }
  },
  computed: {
    show_player() {
      const { tool } = this.tool_storage.state.selected
      return tool === 'video_path' || !tool
    },
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
      const room_bounds = {}
      rooms.forEach((r) => {
        const [zone_x, zone_y] = zone_offsets[r.zone]
        const [x, y, w, h] = r.data.zone.bounds
        room_bounds[r.id] = [zone_x + x, zone_y + y, w, h]
      })

      // Only show items for which a room is visible
      items = items.filter((i) => !!room_bounds[i.room])

      const svg = {
        viewBox: map_bounds.join(' '),
        style: {
          height: `${100 * map_bounds[3]}%`,
          width: `${100 * map_bounds[2]}%`,
        },
      }

      return { map_bounds, zones, rooms, zone_offsets, room_bounds, items, svg }
    },
    ready() {
      const { world, world_rooms } = this.$store.route
      return world && this.zones.length && world_rooms.length
    },
    visible_items() {
      const { zone, zone_items, world_items } = this.$store.route
      return zone ? zone_items : world_items
    },
    zones() {
      return this.$store.route.zones.filter((z) => !z.data.hidden)
    },
    wrapper_class() {
      const image_zoom = this.osd_store.viewer?.world
        .getItemAt(0)
        ?.viewportToImageZoom(this.osd_store.state.zoom)
      const zoom = clamp(Math.ceil(Math.log2(image_zoom)), -4, 4)
      const { tool, variant } = this.tool_storage.state.selected
      const layers = this.tool_storage.getVisibleLayers()
      return [
        'app-body -full-screen',
        `-zoom-${zoom} -tool-${tool} -variant-${variant}`,
        layers.map((l) => `-layer-${l}`),
      ]
    },
  },
  watch: {
    'tool_storage.state.show_walls': 'syncImages',
    'tool_storage.state.show_bts': 'syncImages',
    'tool_storage.state.show_layer-1': 'syncImages',
    'tool_storage.state.show_plm_enemies': 'syncImages',
  },
  methods: {
    loadImages() {
      let x_max = 10
      let y_max = 10
      const { zone, zone_rooms, world } = this.$store.route
      if (zone) {
        zone_rooms.forEach((room) => {
          const [x, y, width, height] = room.data.zone.bounds
          x_max = Math.max(x_max, x + width)
          y_max = Math.max(y_max, y + height)
        })
      } else {
        this.zones.forEach((zone) => {
          const [x, y, width, height] = zone.data.world.bounds
          const visible_layers = this.tool_storage.getVisibleLayers()
          DZI_LAYERS.forEach((layer) => {
            const tileSource = `/media/sm_zone/${world.slug}/${layer}/${zone.slug}.dzi`
            const opacity = visible_layers.includes(layer) ? 1 : 0
            this.osd_store.viewer.addTiledImage({ tileSource, width, x, y, opacity })
          })

          x_max = Math.max(x_max, x + width)
          y_max = Math.max(y_max, y + height)
        })
      }
      this.osd_store.viewer.addOnceHandler('tile-loaded', () => {
        let { item, room } = this.$route.query
        if (item) {
          const item_id = parseInt(item)
          this.osd_store.gotoItem(
            this.$store.route.world_items.find((i) => i.id === item_id),
            this.map_props,
          )
        } else if (room) {
          const room_id = parseInt(room)
          this.osd_store.gotoRoom(
            this.$store.route.world_rooms.find((r) => r.id === room_id),
            this.map_props,
          )
        } else {
          this.osd_store.viewer.viewport.fitBounds(new Rect(0, 0, x_max, y_max), true)
          this.syncImages()
        }
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
      const visible_layers = this.tool_storage.getVisibleLayers()
      this.osd_store.viewer.world._items.forEach((i) => {
        const url = i.source.tilesUrl || ''
        if (url.match(world_re)) {
          const layer = DZI_LAYERS.find((l) => url.includes(`/${l}/`))
          const opacity = visible_layers.includes(layer) ? 1 : 0
          i.setOpacity(opacity)
        }
      })
    },
    gotoRoom(room) {
      this.osd_store.gotoRoom(room, this.map_props)
    },
  },
}
</script>
