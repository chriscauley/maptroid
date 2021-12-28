import unrest from '@unrest/vue'

import admin_options from './admin'
import room from './room'
import tool from './tool'
import world from './world'

const store = unrest.Store({ room, tool, world })
const admin_modules = ['room', 'world']

admin_modules.forEach((model_name) =>
  unrest.admin.register({
    model_name,
    storage: store[model_name],
    admin_options: admin_options[model_name],
  }),
)

export default store
