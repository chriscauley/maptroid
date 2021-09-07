import Unrest from '@unrest/vue'
// import auth from '@unrest/vue-auth'
import { createRouter, createWebHistory } from 'vue-router'

import views from '@/views'
import admin from '@/admin'

const routes = [
  ...Unrest.loadViews(views),
  ...Unrest.loadViews(admin.views),
  // ...auth.routes,
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(Unrest.applyMeta)

export default router
