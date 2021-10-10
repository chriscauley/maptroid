import { RestStorage } from '@unrest/vue-storage'

export default () => {
  const storage = RestStorage('schema/world')
  return storage
}
