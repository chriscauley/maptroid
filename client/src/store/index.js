import item from './item'
import room from './room'
import viewer from './viewer'

const store = {}
const modules = { item, room, viewer }

Object.entries(modules).forEach(([name, module]) => {
  store[name] = module({ store })
})

export default {
  install(app) {
    app.config.globalProperties.$store = store
  },
}
