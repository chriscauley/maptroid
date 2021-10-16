import unrest from '@unrest/vue'

import admin_options from './admin'
import item from './item'
import osd from './osd'
import playthrough from './playthrough'
import room from './room'
import room2 from './room2'
import screenshot from './screenshot'
import viewer from './viewer'
import world from './world'
import world2 from './world2'
import zone from './zone'

import _migrations from './migrations'

const store = {}

const modules = { item, osd, playthrough, room, room2, screenshot, viewer, world, world2, zone }
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
// _migrations.clearPlaythroughs(store)
window._store = store

export default {
  install(app) {
    app.config.globalProperties.$store = store
  },
}
