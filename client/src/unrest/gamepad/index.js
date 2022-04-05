import ConfigureGamepad from './ConfigureGamepad'
import TestGamepad from './TestGamepad'
import store from './store.js'

export default {
  ConfigureGamepad,
  TestGamepad,
  install(app, initial = {}) {
    store.setDefaults(initial)
    app.config.globalProperties.$gamepad = store
  },
}
