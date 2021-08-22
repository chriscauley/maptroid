import { LocalStorage } from '@unrest/vue-storage'

export default () => {
  const item_store = LocalStorage('item')
  return {
    ...item_store,
    getItems: () => item_store.getPage({ per_page: 1e9 })?.items || [],
  }
}
