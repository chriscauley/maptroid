import { createApp } from 'vue'
import App from './App.vue'
import OpenSeadragon from './OpenSeadragon.vue'
import UnrestMouseTracker from '@/components/unrest/MouseTracker.vue'
import UnrestAdminPopup from '@/components/unrest/AdminPopup.vue'
import WorldSelect from '@/components/WorldSelect.vue'
import VideoPlayer from '@/components/Video/index.vue'

import gamepad from '@/unrest/gamepad'
import unrest from '@unrest/vue'
import auth from '@unrest/vue-auth'
import form from '@unrest/vue-form'
import toolbar from '@unrest/vue-toolbar'
import '@unrest/tailwind/dist.css'
import sm from 'sm-vue'

import store from '@/store'
import '@/css/base.scss'
import router from '@/router'

auth.configure({
  AUTH_START: '/',
  oauth_providers: ['github'],
})

const gamepad_options = {
  jump: 'a',
  special: 'b',
  shoot1: 'x',
  shoot2: 'y',
  aimup: 'r',
  aimdown: 'l',
  run: 'lt',
  pause: 'start',
  swap: 'select',
  // TODO __locked gets overridden by local storage
  __locked: ['up', 'down', 'left', 'right', 'start'],
}

const app = createApp(App)
  .component('OpenSeadragon', OpenSeadragon)
  .component('UnrestMouseTracker', UnrestMouseTracker)
  .component('UnrestAdminPopup', UnrestAdminPopup)
  .component('VideoPlayer', VideoPlayer)
  .component('WorldSelect', WorldSelect)
  .use(sm)
  .use(gamepad, gamepad_options)
  .use(form)
  .use(store)
  .use(toolbar)
  .use(unrest.plugin)
  .use(unrest.ui)
  .use(router)
  .use(auth.plugin)

app.config.unwrapInjectedRef = true
app.mount('#app')
