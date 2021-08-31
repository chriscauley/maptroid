import item from './item'
import playthrough from './playthrough'
import room from './room'
import viewer from './viewer'
import world from './world'

import _migrations from './migrations'

const store = {}
const modules = { item, playthrough, room, viewer, world }

Object.entries(modules).forEach(([name, module]) => {
  store[name] = module({ store })
})

// _migrations.locateItems(store)
// _migrations.migrateItems(store)
window._store = store

export default {
  install(app) {
    app.config.globalProperties.$store = store
  },
}
