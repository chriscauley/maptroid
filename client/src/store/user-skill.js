import { RestStorage } from '@unrest/vue-storage'

const slug = 'schema/user-skill'

export default () => {
  const storage = RestStorage(slug, { collection_slug: slug })
  return storage
}
