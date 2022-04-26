import { LocalStorage } from '@unrest/vue-storage'

const LS_KEY = 'SAVED_GAME'

export default () => {
  const storage = LocalStorage(LS_KEY)
  return storage
}
