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
  }
}
