import { reactive } from 'vue'
import Item from '@/models/Item'

export default ({ store }) => {
  const state = reactive({
    // TODO much of these are tool realted and would justify a second store
    selected_tool: null,
    door_tool: 'blue',
    room_tool: 'crateria',
    item_tool: 'missile',
    selected_item: null,
    oobFix: null,
    selected_room_id: null,
    map_style: 'full',
    map_tool: 'save',
    zoom: 1,
  })
  const getSelectedRoom = () => {
    const id = state.selected_room_id
    return id ? store.room.getOne(id) : state.draft_room
  }

  const getPointer = (scale = 1) => {
    const start = state.drag_start || state.pointer
    if (!start) {
      return {}
    }
    const end = state.drag_end || { x: start.x, y: start.y }
    const [x1, y1, x2, y2] = [start.x, start.y, end.x + scale, end.y + scale].map(
      (i) => scale * Math.floor(i / scale),
    )

    const x = Math.min(x1, x2)
    const y = Math.min(y1, y2)
    const width = Math.abs(x1 - x2)
    const height = Math.abs(y1 - y2)
    return { x, y, width, height }
  }

  return {
    state,
    getSelectedRoom,
    getPointer,
    patch: (new_state) => {
      Object.assign(state, new_state)
      if ('selected_item' in new_state) {
        const item = store.item.getOne(state.selected_item)
        state.oobFix = item && Item.getOutOfBoundsFix(item)
      } else {
        delete state.oobFix
      }
    },
    clickRoom: (scale, game) => {
      const { room_tool } = state
      let { x, y } = getPointer(scale)
      x = x / scale
      y = y / scale
      let room = getSelectedRoom()
      if (!room) {
        const unselected_room = game.getRoomByXY([x, y])
        if (unselected_room) {
          state.selected_room_id = unselected_room.id
          return
        }
        room = state.draft_room = {
          zone: room_tool,
          xys: [],
        }
      }
      const matchXY = (xy) => xy[0] === x && xy[1] === y
      if (room.xys.find(matchXY)) {
        room.xys = room.xys.filter((xy) => !matchXY(xy))
      } else {
        room.xys.push([x, y])
      }
    },
    unSelectRoom() {
      delete state.selected_room_id
      delete state.draft_room
    },
  }
}
