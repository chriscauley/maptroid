import { RestStorage } from '@unrest/vue-storage'

export default ({ store }) => {
  const storage = RestStorage('schema/run', { collection_slug: 'schema/run' })

  const getUserId = () => store._app.config.globalProperties.$auth.user?.id

  Object.assign(storage, {
    getCurrentRun() {
      const user_id = getUserId()
      const { world_runs } = store.route
      if (!user_id) {
        return undefined
      }
      const { current_run_id } = store.local.state
      return world_runs.find((r) => r.id === current_run_id && r.user === user_id) || world_runs[0]
    },
    setCurrentRun(value) {
      store.local.save({ current_run_id: value?.id })
    },
    startNewRun() {
      const world_id = store.route.world.id
      storage.save({ user: getUserId(), world: world_id }).then((world) => {
        storage.setCurrentRun(world)
      })
    },

    addAction(action) {
      const { insert_run_action_after } = store.local.state
      const run = storage.getCurrentRun()
      if (insert_run_action_after !== undefined) {
        run.data.actions.splice(insert_run_action_after + 1, 0, action)
        store.local.save({ insert_run_action_after: insert_run_action_after + 1 })
      } else {
        run.data.actions.push(action)
      }
      return store.run.save(run).then(store.refetch)
    },

    removeLastActionAtXY([x, y], room) {
      let last_index
      const run = storage.getCurrentRun()
      run.data.actions.forEach(([type, id, xy], i) => {
        if (type === 'room_xy' && id === room.id && xy[0] === x && xy[1] === y) {
          last_index = i
        }
      })
      run.data.actions = run.data.actions.filter((_, index) => index !== last_index)
      const { insert_run_action_after } = store.local.state
      if (last_index <= insert_run_action_after) {
        store.local.save({ insert_run_action_after: insert_run_action_after - 1 })
      }
      return store.run.save(run).then(store.refetch)
    },

    refetch() {
      store.run.api.markStale()
      store.run.getCurrentRun()
    },
  })

  return storage
}
