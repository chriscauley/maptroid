import { createApp } from 'vue'
import App from './App.vue'
import OpenSeadragon from './OpenSeadragon.vue'
import UnrestMouseTracker from '@/components/unrest/MouseTracker.vue'
import UnrestToolbar from '@/components/unrest/Toolbar.vue'
import UnrestAdminPopup from '@/components/unrest/AdminPopup.vue'

import unrest from '@unrest/vue'
import auth from '@unrest/vue-auth'
import form from '@unrest/vue-form'
import '@unrest/tailwind/dist.css'

import store from '@/store'
import '@/styles/base.scss'
import router from '@/router'

auth.configure({
  AUTH_START: '/',
  oauth_providers: ['github'],
})

createApp(App)
  .component('OpenSeadragon', OpenSeadragon)
  .component('UnrestMouseTracker', UnrestMouseTracker)
  .component('UnrestToolbar', UnrestToolbar)
  .component('UnrestAdminPopup', UnrestAdminPopup)
  .use(form.plugin)
  .use(store)
  .use(unrest.plugin)
  .use(unrest.ui)
  .use(router)
  .use(auth.plugin)
  .mount('#app')
