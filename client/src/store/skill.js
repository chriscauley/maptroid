import { RestStorage } from '@unrest/vue-storage'

const slug = 'schema/skill'

export default () => {
  const storage = RestStorage(slug, { collection_slug: slug })
  return storage
}
