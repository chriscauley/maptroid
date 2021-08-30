import item from './item'
import room from './room'
import viewer from './viewer'
import world from './world'

import _migrations from './migrations'

const store = {}
const modules = { item, room, viewer, world }

Object.entries(modules).forEach(([name, module]) => {
  store[name] = module({ store })
})

// _migrations.locateItems(store)
// _migrations.migrateItems(store)

export default {
  install(app) {
    app.config.globalProperties.$store = store
  },
}
