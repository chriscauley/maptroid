import Store from './Store'

export default () => {
  const store = Store('playthrough')
  store.fetchOrCreateByWorldId = (world_id) => {
    return store.fetchPage({ query: { world_id } }).then(({ items }) => {
      return items[0] || { world_id, actions: [] }
    })
  }
  return store
}
