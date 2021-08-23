import { LocalStorage } from '@unrest/vue-storage'
// import downloadJson from '@/lib/downloadJson'

export default () => {
  const item_store = LocalStorage('item')
  // downloadJson(item_store.getPage({ per_page: 1e9}), 'items.json')
  return {
    ...item_store,
    getItems: () => item_store.getPage({ per_page: 1e9 })?.items || [],
  }
}
