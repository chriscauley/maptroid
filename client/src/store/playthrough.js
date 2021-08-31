import { LocalStorage } from '@unrest/vue-storage'

export default () => {
  const store = LocalStorage('playthrough')
  store.fetchOrCreateByWorldId = (world_id) => {
    return store.fetchPage({ query: { world_id } }).then(({ items }) => {
      return items[0] || { world_id, actions: [] }
    })
  }
  return store
}
