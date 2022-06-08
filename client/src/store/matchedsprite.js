import { RestStorage } from '@unrest/vue-storage'

export default () => {
  const storage = RestStorage('schema/matched-sprite', { collection_slug: 'schema/matched-sprite' })
  return storage
}
