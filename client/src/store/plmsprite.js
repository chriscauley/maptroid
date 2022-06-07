import { RestStorage } from '@unrest/vue-storage'

export default () => {
  const storage = RestStorage('schema/plm-sprite', { collection_slug: 'schema/plm-sprite' })
  return storage
}
