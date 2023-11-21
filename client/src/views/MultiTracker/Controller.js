import { ReactiveRestApi } from '@unrest/vue-storage'

const api = ReactiveRestApi({ live_api: true })

export default (slug, component) => {
  const password = () => component.$route.query.password
  const url = () => `multi-tracker/${slug}/?password=${password()}`
  const put = (data) =>
    api.put(url(), data).catch((error) => {
      if (error.response?.data?.error === 'BAD_PASSWORD') {
        component.modal = 'passsword-form'
      }
      return { error }
    })

  const controller = {
    get: () => api.get(url()),
    markStale: api.markStale,
    hasPassword: () => !!password(),
    setPassword: (password) => put({ password, action: 'check-password' }),
    addAction: (value) => put({ action: 'add-action', value }),
    setObjectives: (value) => put({ action: 'set-objectives', value }),
    reset: () => put({ action: 'reset-room' }),
  }
  return controller
}
