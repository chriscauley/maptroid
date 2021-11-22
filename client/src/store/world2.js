import { RestStorage } from '@unrest/vue-storage'

export default () => {
  const storage = RestStorage('schema/world', { collection_slug: 'schema/world' })
  storage.getFromRoute = (route) => {
    const { world_slug } = route.params
    const list = storage.getPage({ query: { per_page: 5000 } })?.items || []
    return {
      list,
      current: list.find((w) => w.slug === world_slug),
    }
  }
  return storage
}
