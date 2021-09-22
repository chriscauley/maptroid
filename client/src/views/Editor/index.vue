<template>
  <div :class="editor_class" v-if="world">
    <open-seadragon :pixelated="true" :options="viewer_options" :events="viewer_events" />
    <template v-if="$store.osd_viewer">
      <html-overlay :world="world" :screens="screens" @click-item="clickItem">
        <item-box
          v-for="item in items"
          :item="item"
          :world="world"
          :key="item.id"
          @click="clickItem(item)"
        />
      </html-overlay>
      <selected-item v-if="selected_item" :key="selected_item" :world="world" />
      <mouse-tracker :world="world" :game="game" />
      <toolbar :world="world" />
    </template>
    <selected-room v-if="$store.viewer.getSelectedRoom()" _scale="_scale" :world="world" />
    <item-panel v-else :world="world" :game="game" :gotoRoom="gotoRoom" :gotoItem="gotoItem" />
  </div>
</template>

<script>
import ItemPanel from './ItemPanel.vue'
import MouseTracker from './MouseTracker.vue'
import SelectedItem from './SelectedItem.vue'
import SelectedRoom from './SelectedRoom.vue'
import Toolbar from './Toolbar.vue'

import HtmlOverlay from '../Viewer/HtmlOverlay.vue'
import ItemBox from '../Viewer/ItemBox.vue'
import ViewerMixin from '../Viewer/Mixin'
import WorldMixin from '../Viewer/WorldMixin'

import Room from '@/models/Room'

export default {
  __route: {
    path: '/editor/:world_id/',
  },
  components: {
    HtmlOverlay,
    ItemBox,
    ItemPanel,
    MouseTracker,
    SelectedItem,
    SelectedRoom,
    Toolbar,
  },
  mixins: [ViewerMixin, WorldMixin],
  computed: {
    editor_class() {
      const { selected_room_id } = this.$store.viewer.state
      return [this.viewer_class, 'map-editor', { '-has-selected-room': selected_room_id }]
    },
    selected_item() {
      return this.$store.viewer.state.selected_item
    },
    items() {
      return this.$store.item.getAll({ world_id: this.world.id })
    },
    screens() {
      let out = []
      const rooms = this.$store.room.getAll({ world_id: this.world.id }).slice()
      const { draft_room } = this.$store.viewer.state
      if (draft_room) {
        rooms.push(draft_room)
      }
      const { map_style, selected_room_id } = this.$store.viewer.state
      rooms.forEach((room) => {
        const onClick = () => {
          const { zone, id } = room
          this.$store.viewer.patch({ selected_room_id: id, room_tool: zone, selected_tool: 'room' })
        }
        const selected = room.id === selected_room_id
        out = out.concat(Room.makeRoom(room, { map_style, selected, onClick }))
      })
      const { oobFix } = this.$store.viewer.state
      if (oobFix) {
        oobFix.onClick = () => {
          oobFix.item.screen_xy = oobFix.screen_xy
          oobFix.item.world_xy = oobFix.world_xy
          this.$store.item.save(oobFix.item)
          this.$store.viewer.patch({ selected_item: oobFix.item.id })
        }
        out.push(oobFix)
      }
      return out
    },
  },
  methods: {
    clickItem(item) {
      this.$store.viewer.patch({ selected_item: item.id })
    },
  },
}
</script>
