import unrest from '@unrest/vue'
import auth from '@unrest/vue-auth'
import { createRouter, createWebHistory } from 'vue-router'

import views from '@/views'

const routes = [...unrest.loadViews(views), ...unrest.loadViews(unrest.admin.views), ...auth.routes]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(auth.checkAuth)
router.beforeEach(unrest.applyMeta)

export default router
