import { ReactiveRestApi, ReactiveLocalStorage } from '@unrest/vue-storage'

const passwords = ReactiveLocalStorage({
  LS_KEY: 'multitracker_passwords',
})

const api = ReactiveRestApi({ live_api: true })

export default (slug, component) => {
  const url = () => `multi-tracker/${slug}/?password=${passwords.state[slug]}`
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
    hasPassword: () => !!passwords.state[slug],
    setPassword: (password) =>
      put({ password, action: 'check-password' }).then((response) => {
        if (!response.error) {
          passwords.save({ [slug]: password })
        }
      }),
    addAction: (value) => put({ action: 'add-action', value }),
    setObjectives: (value) => put({ action: 'set-objectives', value }),
    reset: () => put({ action: 'reset-room' }),
  }
  return controller
}
