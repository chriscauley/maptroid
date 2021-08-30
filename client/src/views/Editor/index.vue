<template>
  <div :class="[viewer_class, 'map-editor']">
    <open-seadragon :pixelated="true" :options="options" :events="events" />
    <template v-if="viewer">
      <html-overlay
        :viewer="viewer"
        :screens="screens"
        :items="items"
        :visible_rooms="visible_rooms"
      />
      <mouse-tracker :viewer="viewer" />
      <toolbar />
    </template>
    <selected-room v-if="$store.viewer.getSelectedRoom()" _scale="_scale" />
    <item-panel v-else :viewer="viewer" />
  </div>
</template>

<script>
import ItemPanel from './ItemPanel.vue'
import MouseTracker from './MouseTracker.vue'
import SelectedRoom from './SelectedRoom.vue'
import Toolbar from './Toolbar.vue'
import HtmlOverlay from '../Viewer/HtmlOverlay.vue'
import ViewerMixin from '../Viewer/Mixin'

import Room from '@/models/Room'

export default {
  __route: {
    path: '/editor/',
  },
  components: { HtmlOverlay, ItemPanel, MouseTracker, SelectedRoom, Toolbar },
  mixins: [ViewerMixin],
  computed: {
    items() {
      return this.$store.item.getAll()
    },
    screens() {
      let out = []
      const rooms = this.$store.room.getAll().slice()
      const { draft_room } = this.$store.viewer.state
      if (draft_room) {
        rooms.push(draft_room)
      }
      const { map_style, selected_room_id } = this.$store.viewer.state
      this.$store.viewer.state.rando // eslint-disable-line
      rooms.forEach((room) => {
        const onClick = () => this.$store.viewer.patch({ selected_room_id: room.id })
        const selected = room.id === selected_room_id
        out = out.concat(Room.makeRoom(room, { map_style, selected, onClick }))
      })
      return out
    },
    visible_rooms() {
      return this.$store.room.getAll()
    },
  },
}
</script>
