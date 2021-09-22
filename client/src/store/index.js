import { reactive, markRaw } from 'vue'
import unrest from '@unrest/vue'

import admin_options from './admin'
import item from './item'
import playthrough from './playthrough'
import room from './room'
import viewer from './viewer'
import world from './world'

import _migrations from './migrations'

const state = reactive({
  osd_viewer: null,
})

const store = {
  get osd_viewer() {
    return state.osd_viewer
  },
  set osd_viewer(value) {
    state.osd_viewer = markRaw(value)
  }
}
const modules = { item, playthrough, room, viewer, world }
const admin_modules = ['item', 'playthrough', 'room', 'world']

Object.entries(modules).forEach(([name, module]) => {
  store[name] = module({ store })
})

admin_modules.forEach((model_name) =>
  unrest.admin.register({
    model_name,
    storage: store[model_name],
    admin_options: admin_options[model_name],
  }),
)

// _migrations.moveItems(store)
// _migrations.migrateItems(store)
window._store = store

export default {
  install(app) {
    app.config.globalProperties.$store = store
  },
}
