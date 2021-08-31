import { LocalStorage } from '@unrest/vue-storage'

import downloadJson from '@/lib/downloadJson'

const prepareItem = ({ ...item }, getNextId) => {
  if (item.id === undefined) {
    item.id = getNextId()
  }
  return item
}

export default (name, initial) => {
  const store = LocalStorage(name, { prepareItem, initial })

  store.getAll = (query) => store.getPage({ per_page: 1e9, query })?.items || []
  window['_download' + name[0].toUpperCase() + name.slice(1)] = store.downloadJson = () => {
    const data = {}
    store.getAll().forEach((i) => (data[i.id] = i))
    downloadJson(data, name + '.json')
  }

  return store
}
