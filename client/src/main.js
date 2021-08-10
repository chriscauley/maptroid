import { createApp } from 'vue'
import App from './App.vue'
import OpenSeadragon from './OpenSeadragon.vue'

createApp(App)
  .component('OpenSeadragon', OpenSeadragon)
  .mount('#app')
