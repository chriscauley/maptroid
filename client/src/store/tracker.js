import { reactive } from 'vue'
import { startCase } from 'lodash'
import { ReactiveLocalStorage, getClient } from '@unrest/vue-storage'

export default ({ store }) => {
  const storage = ReactiveLocalStorage({
    LS_KEY: 'tracker_local',
    local_dev: true,
    api_status: 'off',
  })
  const _state = reactive({
    inventory: {},
    location_completed_by_id: {},
    location_open_by_name: {},
    add_order: [],
    item_lookup: {},
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

  const getSchema = () => {
    const { $route } = store._app.config.globalProperties
    const { world_slug } = $route.params
    const key = `${world_slug}__schema`
    return _state[key]
  }

  const _getClient = () => {
    const domain = storage.state.local_dev ? 'https:localhost:8732' : ''
    const baseURL = `${domain}/api`
    if (_state.baseURL !== baseURL) {
      _state.baseURL = baseURL
      _state.client = getClient({ baseURL })
    }
    return _state.client
  }
  const _refetch = () => {
    const { world } = store._app.config.globalProperties.$store.route
    if (!world.data.mc_data?.randomizer) {
      return
    }

    const { inventory } = _state
    const { can, fill_choice } = storage.state
    const data = { world: world.slug, fill_choice, inventory, can }
    storage.state.api_status = 'loading'

    _getClient()
      .post('explore/', data)
      .then(({ locations, schema, major_locations }) => {
        _state.location_open_by_name = locations
        _state.major_locations = major_locations
        if (major_locations) {
          _state.major_locations = {}
          major_locations.forEach((name) => (_state.major_locations[name] = true))
        }
        _state[`${world.slug}__schema`] = schema
        _recalculate()
        storage.state.api_status = 'ok'
      })
      .catch(() => {
        storage.state.api_status = 'error'
        const msg = 'An unknown error occurred with the randomizer'
        store._app.config.globalProperties.$ui.toast.error(msg)
      })
  }
  const update = () => {
    _recalculate()
    _refetch()
  }
  const _recalculate = () => {
    const inventory = {}
    const location_completed_by_id = {}
    let add_order = ['egg']
    storage.getActions().forEach(([action, slug, delta]) => {
      if (action === ADD_ITEM) {
        inventory[slug] = (inventory[slug] || 0) + delta
        if (inventory[slug] > 0) {
          !add_order.includes(slug) && add_order.push(slug)
        } else {
          add_order = add_order.filter((i) => i !== slug)
        }
      } else if (action === TOGGLE_ITEM) {
        inventory[slug] = !inventory[slug]
        if (inventory[slug]) {
          !add_order.includes(slug) && add_order.push(slug)
        } else {
          add_order = add_order.filter((i) => i !== slug)
        }
      } else if (action === TOGGLE_LOCATION) {
        location_completed_by_id[slug] = !location_completed_by_id[slug]
      }
    })
    _state.location_completed_by_id = location_completed_by_id
    _state.inventory = inventory
    const key_useds = getKeyUseds()
    const last_item = add_order[add_order.length - 1]
    _state.add_order = add_order
    Object.entries(_state.location_open_by_name).forEach(([name, open]) => {
      const key_used = key_useds[name]
      if (key_used === 'sequence-break') {
        // this is handled when they click the item
        return
      }
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
    getSchema,
    addItem: (slug, delta) => saveAction([ADD_ITEM, slug, delta]),
    toggleItem: (slug) => saveAction([TOGGLE_ITEM, slug]),
    toggleLocation: (id) => {
      const item = _state.item_lookup[id]
      if (item) {
        const slug = item.data.location_name
        const key_useds = getKeyUseds()
        const key_used = key_useds[slug]
        const was_completed = storage.isLocationCompleted(item)
        if (was_completed && key_used === 'sequence-break') {
          delete key_useds[slug]
          storage.save({ [getUnlockKey()]: key_useds })
        } else if (!was_completed && !key_used) {
          key_useds[slug] = 'sequence-break'
          storage.save({ [getUnlockKey()]: key_useds })
        }
      }
      saveAction([TOGGLE_LOCATION, id])
    },
    getInventory: () => _state.inventory,
    listLocationNames: () => Object.keys(_state.location_open_by_name),
    getKeyOrder: (key) => {
      if (key === 'sequence-break') {
        return Infinity
      }
      return _state.add_order.indexOf(key)
    },
    getKeyIcon(key) {
      if (key === 'egg') {
        return 'sm-map -egg'
      }
      if (key === 'sequence-break') {
        return 'sm-item -nothing -is-major smva-difficulty -difficulty-break'
      }
      return `sm-item -${key || 'empty smva-difficulty -difficulty-break'}`
    },
    getKeyName(key) {
      if (key === 'egg') {
        return 'Free'
      }
      if (!key) {
        return 'Unavailable'
      }
      return startCase(key)
    },
    getIcon(item) {
      if (item.data.hidden) {
        return 'sm-item -hidden'
      }
      const { major_locations } = _state
      const is_major = !major_locations || major_locations[item.data.location_name]
      const major = is_major && '-rando-major'
      const key_used = storage.getKeyUsed(item)
      const completed = _state.location_completed_by_id[item.id]
      if (!key_used) {
        return ['sm-item smva-difficulty -difficulty-break', completed ? '-nothing' : '-empty']
        // return [
        //   'sm-item smva-difficulty',
        //   completed ? '-nothing -difficulty-mania' : '-empty -difficulty-break',
        //   major,
        // ]
      }
      const icon = storage.getKeyIcon(key_used)
      return [icon, completed && '-completed', major]
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
        add_order: [],
        item_lookup: {},
      })
      update()
    },
    init(component) {
      const items = component.$store.route.world_items
      _state.item_lookup = {}
      items.forEach((item) => {
        _state.item_lookup[item.data.location_name] = item
        _state.item_lookup[item.id] = item
      })
      update()
    },
  })
  return storage
}
