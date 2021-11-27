import { RestStorage } from '@unrest/vue-storage'

export default () => {
  const storage = RestStorage('schema/smile-sprite', { collection_slug: 'schema/smile-sprite' })
  return storage
}
