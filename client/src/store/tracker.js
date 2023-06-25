import { reactive } from 'vue'
import { startCase } from 'lodash'
import { ReactiveLocalStorage, getClient } from '@unrest/vue-storage'

const client = getClient()

export default ({ store }) => {
  const storage = ReactiveLocalStorage({ LS_KEY: 'tracker_local' })
  const _state = reactive({
    inventory: {},
    location_completed_by_id: {},
    location_open_by_name: {},
  })

  const getActionKey = () => {
    const { world_slug } = store._app.config.globalProperties.$route.params
    return `${world_slug}__actions`
  }
  const getUnlockKey = () => {
    const { world_slug } = store._app.config.globalProperties.$route.params
    return `${world_slug}__unlock`
  }
  const getActions = () => storage.state[getActionKey()] || []
  const getKeyUseds = () => storage.state[getUnlockKey()] || {}
  const ADD_ITEM = 'ADD_ITEM'
  const TOGGLE_ITEM = 'TOGGLE_ITEM'
  const TOGGLE_LOCATION = 'TOGGLE_LOCATION'
  const saveAction = (action) => {
    storage.save({
      [getActionKey()]: [...getActions(), action],
    })
    update()
  }
  const _refetch = () => {
    const world = store._app.config.globalProperties.$route.params.world_slug
    const logic = 'expert'
    const { inventory } = _state
    const data = { world, logic, inventory }
    const items_by_location_name = {}
    store._app.config.globalProperties.$store.route.world_items.forEach((item) => {
      items_by_location_name[item.data.location_name] = item
    })
    client.post('solve/', data).then(({ locations }) => {
      _state.location_open_by_name = locations
      _recalculate()
    })
  }
  const update = () => {
    _recalculate()
    _refetch()
  }
  const _recalculate = () => {
    const inventory = {}
    const location_completed_by_id = {}
    const add_order = { egg: true }
    storage.getActions().forEach(([action, slug, delta]) => {
      if (action === ADD_ITEM) {
        inventory[slug] = (inventory[slug] || 0) + delta
        if (inventory[slug] > 0) {
          add_order[slug] = true
        } else {
          delete add_order[slug]
        }
      } else if (action === TOGGLE_ITEM) {
        inventory[slug] = !inventory[slug]
        if (inventory[slug]) {
          add_order[slug] = true
        } else {
          delete add_order[slug]
        }
      } else if (action === TOGGLE_LOCATION) {
        location_completed_by_id[slug] = !location_completed_by_id[slug]
      }
    })
    _state.location_completed_by_id = location_completed_by_id
    _state.inventory = inventory
    const key_useds = getKeyUseds()
    const last_item = Object.keys(add_order).pop()
    Object.entries(_state.location_open_by_name).forEach(([name, open]) => {
      const key_used = key_useds[name]
      if (key_used) {
        if (key_used !== 'egg' && !inventory[key_useds[name]]) {
          // item which unlocked location has been taken out of inventory
          delete key_useds[name]
        }
      } else if (open) {
        // location just opened up, assume last item opened it
        key_useds[name] = last_item
      }
      if (!open) {
        delete key_useds[name]
      }
    })
    storage.save({ [getUnlockKey()]: key_useds })
  }

  Object.assign(storage, {
    update,
    getActionKey,
    getActions,
    addItem: (slug, delta) => saveAction([ADD_ITEM, slug, delta]),
    toggleItem: (slug) => saveAction([TOGGLE_ITEM, slug]),
    toggleLocation: (slug) => saveAction([TOGGLE_LOCATION, slug]),
    getInventory: () => _state.inventory,
    listLocationNames: () => Object.keys(_state.location_open_by_name),
    getKeyIcon(key) {
      if (key === 'egg') {
        return 'sm-map -egg'
      }
      if (!key) {
        // TODO
      }
      return `sm-item -${key}`
    },
    getKeyName(key) {
      if (key === 'egg') {
        return 'Free'
      }
      if (!key) {
        return 'Sequence break'
      }
      return startCase(key)
    },
    getIcon(item) {
      const key_used = storage.getKeyUsed(item)
      const completed = _state.location_completed_by_id[item.id]
      if (!key_used) {
        return completed
          ? ['sm-item -nothing smva-difficulty -difficulty-mania']
          : ['sm-item -empty smva-difficulty -difficulty-break']
      }
      const icon = storage.getKeyIcon(key_used)
      return [icon, completed && '-completed']
    },
    getKeyUsed(item) {
      return getKeyUseds()[item.data.location_name]
    },
    isLocationCompleted(item) {
      return _state.location_completed_by_id[item.id]
    },
    reset() {
      storage.save({
        [getActionKey()]: [],
        [getUnlockKey()]: {},
      })
      Object.assign(_state, {
        inventory: {},
        location_completed_by_id: {},
        location_open_by_name: {},
      })
      update()
    },
  })
  return storage
}
