import { ReactiveRestApi, ReactiveLocalStorage } from '@unrest/vue-storage'


const passwords = ReactiveLocalStorage({
  LS_KEY: 'multitracker_passwords',
})

const api = ReactiveRestApi({ live_api: true })

export default (slug, component) => {
  const url = `multi-tracker/${slug}/`
  const put = (data) => api
    .put(url, { ...data, password: passwords.state[slug] })
    .catch((error) => {
      console.log(error.response.data.error)
      console.log(error.response.data.error === 'BAD_PASSWORD')
      if (error.response?.data?.error === 'BAD_PASSWORD') {
        console.log(component)
        component.show_password = true
      }
    })


  const controller = {
    get: () => {
      if (passwords.state[slug]) {
        return controller.checkPassword()
      }
      return api.get(url)
    },
    markStale: api.markStale,
    hasPassword: () => !!passwords.state[slug],
    setPassword: (value) => {
      passwords.save({ [slug]: value })
      controller.checkPassword()
    },
    checkPassword: () => put({ action: 'check-password' }),
    addAction: (value) => put({ action: 'add-action', value }),
  }
  return controller
}
