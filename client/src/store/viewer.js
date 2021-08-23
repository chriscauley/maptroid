import { reactive } from 'vue'

export default () => {
  const state = reactive({
    selected_tool: null,
  })
  return {
    state,
    patch: (new_state) => {
      Object.assign(state, new_state)
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
