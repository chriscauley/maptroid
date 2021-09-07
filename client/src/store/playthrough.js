import Store from './Store'
import initial from '@/../public/sm/playthrough.json'

export default () => {
  const store = Store('playthrough', initial)
  store.fetchOrCreateByWorldId = (world_id) => {
    return store.fetchPage({ query: { world_id } }).then(({ items }) => {
      return items[0] || { world_id, actions: [] }
    })
  }
  return store
}
