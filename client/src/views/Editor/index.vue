<template>
  <div :class="[viewer_class, 'map-editor']">
    <open-seadragon :pixelated="true" :options="options" :events="events" />
    <template v-if="viewer">
      <html-overlay :viewer="viewer" :screens="screens" :items="items" />
      <mouse-tracker :viewer="viewer" />
      <toolbar />
    </template>
    <selected-room v-if="$store.viewer.getSelectedRoom()" />
    <item-panel v-else :viewer="viewer" />
  </div>
</template>

<script>
import HtmlOverlay from '../Viewer/HtmlOverlay.vue'
import ItemPanel from './ItemPanel.vue'
import MouseTracker from './MouseTracker.vue'
import SelectedRoom from './SelectedRoom.vue'
import Toolbar from './Toolbar.vue'
import ViewerMixin from '../Viewer/Mixin'

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
      rooms.forEach((room) => {
        out = out.concat(this.makeRoom(room))
      })
      return out
    },
  },
  methods: {
    makeRoom(room) {
      // TODO much of this could be moved into the room model
      const { map_style } = this.$store.viewer.state
      if (map_style === 'off') {
        return []
      }
      const { area } = room
      const xy2i = (xy) => xy[0] + xy[1] * 66
      const _xys = {}
      room.xys.forEach((xy) => {
        _xys[xy2i(xy)] = true
      })
      return room.xys.map(([x, y]) => {
        return {
          id: `screen-${x}_${y}`,
          title: `#${room.id} ${room.name}`,
          x,
          y,
          class: [
            `sm-room -absolute -${area} -style-${map_style}`,
            {
              br0: _xys[xy2i([x + 1, y])],
              bl0: _xys[xy2i([x - 1, y])],
              bb0: _xys[xy2i([x, y + 1])],
              bt0: _xys[xy2i([x, y - 1])],
              '-selected': room.id === this.$store.viewer.state.selected_room_id,
            },
          ],
          onClick: () => this.$store.viewer.patch({ selected_room_id: room.id }),
        }
      })
    },
  },
}
</script>
