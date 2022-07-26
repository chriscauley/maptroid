import { RestStorage } from '@unrest/vue-storage'

const collection_slug = 'schema/world'

const fromServer = (world) => {
  world.data = {
    elevators: [],
    ...world.data,
  }
  return world
}

export default () => {
  const storage = RestStorage('schema/world', { collection_slug, fromServer })
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
