import item from './item'
import viewer from './viewer'

const store = {}
const modules = { viewer, item }

Object.entries(modules).forEach(([name, module]) => {
  store[name] = module({ store })
})

export default {
  install(app) {
    app.config.globalProperties.$store = store
  },
}
