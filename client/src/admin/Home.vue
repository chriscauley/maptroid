<template>
  <div>
    <app-box v-for="app in apps" :key="app.app_label" :app="app" />
  </div>
</template>

<script>
import AppBox from './AppBox.vue'
import store from './store'

export default {
  __route: {
    path: '/admin/',
  },
  components: { AppBox },
  computed: {
    apps() {
      return store.listApps()
    },
  },
}
</script>
