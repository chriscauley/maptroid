<template>
  <div class="html-overlay">
    <div :style="`--border-width: ${border_width}px`">
      <template v-for="room in rooms" :key="room.id">
        <div v-for="block in room.blocks" v-bind="block" :key="block.id" />
      </template>
      <div class="html-overlay__select" v-bind="select_attrs" />
      <div v-for="item in items" v-bind="item" :key="item.id">
        <selected-item v-if="item.selected" />
      </div>
      <div v-if="drag_box" v-bind="drag_box" />
      <div v-else v-bind="ui_attributes" />
    </div>
  </div>
</template>

<script>
import OpenSeadragon from 'openseadragon'
import SelectedItem from './SelectedItem.vue'

const { Point, Rect } = OpenSeadragon

export default {
  components: { SelectedItem },
  props: {
    viewer: Object,
  },
  data() {
    const select_box = { x: 0, y: 0, w: 0, h: 0 }
    return { select_box, W: null, H: null, border_width: 2 }
  },
  computed: {
    rooms() {
      const rooms = this.$store.room.getAll().slice()
      const { draft_room } = this.$store.viewer.state
      if (draft_room) {
        rooms.push(draft_room)
      }
      return rooms.map((room) => ({
        id: room.id,
        blocks: this.makeRoom(room),
      }))
    },
    selected_room_blocks() {
      const selected_room = this.$store.viewer.getSelectedRoom()
      if (!selected_room) {
        return
      }
      return this.makeRoom(selected_room)
    },
    drag_box() {
      const { selected_tool } = this.$store.viewer.state
      if (!['boss', 'door', 'map', 'chozo'].includes(selected_tool)) {
        return {}
      }
      const { x, y, width, height } = this.$store.viewer.drag_bounds
      return {
        style: this._scale({
          left: x,
          top: y,
          width,
          height,
        }),
        class: 'osd__drag-box',
      }
    },
    ui_attributes() {
      const { x, y, scale } = this.$store.viewer.getMousePoint()
      return {
        style: this._scale({
          top: y * scale,
          left: x * scale,
          width: scale,
          height: scale,
        }),
        class: 'hover-box',
      }
    },
    items() {
      const items = this.$store.item.getAll()
      const selected_id = this.$store.viewer.state.selected_item
      return items.map(({ id, x, y, width, height, ...item }) => {
        return {
          id: `overlay-item-${id}`,
          selected: selected_id === id,
          onClick: () => this.$store.viewer.patch({ selected_item: id }),
          class: `item-box -class-${item.class} sm-${item.class} -${item.type}`,
          style: {
            ...this._scale({
              left: x,
              top: y,
              width,
              height,
            }),
          },
        }
      })
    },
    select_attrs() {
      return {}
    },
  },
  mounted() {
    const location = new Rect(0, 0, 1, 1)
    this.viewer.addOverlay(this.$el, location)
    const { x, y } = this.viewer.world.getItemAt(0).getContentSize()
    this.W = this.H = Math.max(x, y)
    this.viewer.addHandler('animation-finish', () => {
      this.border_width = this.viewer.viewport.imageToViewportCoordinates(new Point(2, 2)).x
    })
  },
  methods: {
    _scale(attrs) {
      return Object.fromEntries(
        Object.entries(attrs).map(([k, v]) => [k, `${(100 * v) / this.W}%`]),
      )
    },
    makeRoom(room) {
      const { map_style } = this.$store.viewer.state
      let scale = 256
      let offset_x = 0
      let offset_y = 0
      if (map_style === 'mini') {
        scale = 8
        offset_x = 32.25
        offset_y = 36
      } else if (map_style === 'off') {
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
          id: `selected-room_${x}_${y}`,
          title: `#${room.id} ${room.name}`,
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
          style: this._scale({
            left: (x + offset_x) * scale,
            top: (y + offset_y) * scale,
            width: scale,
            height: scale,
          }),
        }
      })
    },
  },
}
</script>
