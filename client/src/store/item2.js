import { RestStorage } from '@unrest/vue-storage'

export default () => {
  const storage = RestStorage('schema/item', { collection_slug: 'schema/item' })
  return storage
}
