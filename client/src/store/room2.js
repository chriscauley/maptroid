import { RestStorage } from '@unrest/vue-storage'

export default () => {
  const storage = RestStorage('schema/room', { collection_slug: 'schema/room' })
  return storage
}
