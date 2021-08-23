import { createApp } from 'vue'
import App from './App.vue'
import OpenSeadragon from './OpenSeadragon.vue'

import Unrest from '@unrest/vue'
import '@unrest/tailwind/dist.css'

import store from '@/store'
import '@/styles/base.scss'
import router from '@/router'

createApp(App)
  .component('OpenSeadragon', OpenSeadragon)
  .use(store)
  .use(Unrest.plugin)
  .use(Unrest.ui)
  .use(router)
  .mount('#app')
