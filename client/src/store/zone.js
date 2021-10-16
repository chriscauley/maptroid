import { RestStorage } from '@unrest/vue-storage'

export default () => {
  const storage = RestStorage('schema/zone', { collection_slug: 'schema/zone' })
  return storage
}
