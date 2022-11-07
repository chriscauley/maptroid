import unrest from '@unrest/vue'

import admin_options from './admin'
import item from './item'
import local from './local'
import matchedsprite from './matchedsprite'
import osd from './osd'
import play from './play'
import plmsprite from './plmsprite'
import room from './room'
import route from './route'
import run from './run'
import skill from './skill'
import smile from './smile'
import smilesprite from './smilesprite'
import screenshot from './screenshot'
import video from './video'
import world from './world'
import zone from './zone'

import _migrations from './migrations'

const store = {}

const modules = {
  item,
  local,
  matchedsprite,
  osd,
  play,
  plmsprite,
  room,
  run,
  skill,
  smile,
  smilesprite,
  screenshot,
  video,
  world,
  zone,
  route, // must come last
}
const admin_modules = []

// _migrations.moveItems(store)
// _migrations.clearPlaythroughs(store)
window._store = store

export default {
  install(app) {
    app.config.globalProperties.$store = store
    store._app = app

    Object.entries(modules).forEach(([name, module]) => {
      this[name] = store[name] = module({ store })
    })

    admin_modules.forEach((model_name) => {
      unrest.admin.register({
        model_name,
        storage: store[model_name],
        admin_options: admin_options[model_name],
      })
    })
  },
}
