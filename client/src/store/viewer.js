import { reactive } from 'vue'

export default ({ store }) => {
  const state = reactive({
    selected_tool: null,
    room_tool: 'crateria',
    selected_room_id: null,
  })
  const getMousePoint = () => {
    const { selected_tool, pointer } = state
    const { x, y } = pointer || { x: 0, y: 0 }
    const scale = selected_tool === 'room' ? 256 : 16
    return {
      scale,
      x: Math.floor(x / scale),
      y: Math.floor(y / scale),
    }
  }
  const getSelectedRoom = () => {
    const id = state.selected_room_id
    return id ? store.room.getOne(id) : state.draft_room
  }
  return {
    state,
    getMousePoint,
    getSelectedRoom,
    patch: (new_state) => {
      Object.assign(state, new_state)
    },
    clickRoom: () => {
      const { room_tool } = state
      const { x, y } = getMousePoint()
      let room = getSelectedRoom()
      if (!room) {
        room = state.draft_room = {
          area: room_tool,
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
    get drag_bounds() {
      const start = state.drag_start || state.pointer
      if (!start) {
        return {}
      }
      const end = state.drag_end || { x: start.x + 16, y: start.y + 16 }
      const [x1, y1, x2, y2] = [start.x, start.y, end.x, end.y].map((i) => 16 * Math.floor(i / 16))

      const x = Math.min(x1, x2)
      const y = Math.min(y1, y2)
      const width = Math.abs(x1 - x2)
      const height = Math.abs(y1 - y2)
      return { x, y, width, height }
    },
  }
}
