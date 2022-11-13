import { RestStorage } from '@unrest/vue-storage'

const slug = 'schema/user-skill'
console.log('wtf')

export default () => {
  const storage = RestStorage(slug, { collection_slug: slug })
  return storage
}
