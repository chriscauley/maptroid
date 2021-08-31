<template>
  <div :class="[viewer_class, 'map-editor']" v-if="world">
    <open-seadragon :pixelated="true" :options="viewer_options" :events="viewer_events" />
    <template v-if="viewer">
      <html-overlay
        :viewer="viewer"
        :world="world"
        :screens="screens"
        :items="items"
        @click-item="clickItem"
      />
      <selected-item v-if="selected_item" :key="selected_item" :viewer="viewer" />
      <mouse-tracker :viewer="viewer" :world="world" />
      <toolbar :world="world" />
    </template>
    <selected-room v-if="$store.viewer.getSelectedRoom()" _scale="_scale" :world="world" />
    <item-panel v-else :viewer="viewer" :world="world" />
  </div>
</template>

<script>
import ItemPanel from './ItemPanel.vue'
import MouseTracker from './MouseTracker.vue'
import SelectedItem from './SelectedItem.vue'
import SelectedRoom from './SelectedRoom.vue'
import Toolbar from './Toolbar.vue'
import HtmlOverlay from '../Viewer/HtmlOverlay.vue'
import ViewerMixin from '../Viewer/Mixin'
import WorldMixin from '../Viewer/WorldMixin'

import Room from '@/models/Room'

export default {
  __route: {
    path: '/editor/:world_id/',
  },
  components: { HtmlOverlay, ItemPanel, MouseTracker, SelectedItem, SelectedRoom, Toolbar },
  mixins: [ViewerMixin, WorldMixin],
  computed: {
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
        const onClick = () => this.$store.viewer.patch({ selected_room_id: room.id })
        const selected = room.id === selected_room_id
        out = out.concat(Room.makeRoom(room, { map_style, selected, onClick }))
      })
      return out
    },
  },
  methods: {
    clickItem(item) {
      this.$store.viewer.patch({ selected_item: item.id })
    },
    onGameLoad() {},
  },
}
</script>
