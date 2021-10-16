import { RestStorage } from '@unrest/vue-storage'

export default () => {
  const storage = RestStorage('schema/screenshot', { collection_slug: 'schema/screenshot' })
  return storage
}
