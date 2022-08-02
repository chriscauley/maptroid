import { RestStorage, LocalStorage } from '@unrest/vue-storage'

export default ({ store, app }) => {
  const rest_storage = RestStorage('schema/run', { collection_slug: 'schema/run' })
  const local_storage = LocalStorage('schema/run')

  const getStorage = () => (app.$auth.user?.is_superuser ? rest_storage : local_storage)

  const getUserId = () => store._app.config.globalProperties.$auth.user?.id

  const storage = {
    getPage(options) {
      return getStorage().getPage(options)
    },
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
      getStorage()
        .save({ user: getUserId(), world: world_id })
        .then((world) => {
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
      return getStorage()
        .save(run)
        .then(store.refetch)
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
        getStorage().save({ insert_run_action_after: insert_run_action_after - 1 })
      }
      return getStorage()
        .save(run)
        .then(store.refetch)
    },

    refetch() {
      const s = getStorage()
      s.api.markStale()
      s.getCurrentRun()
    },
  }

  return storage
}
