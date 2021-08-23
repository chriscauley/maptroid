import { LocalStorage } from '@unrest/vue-storage'
import downloadJson from '@/lib/downloadJson'
// import items_json from '../../public/sm/items.json'

import Item from '@/models/Item'

const toServer = (i) => {
  delete i.created
  delete i.updated
  return i
}

export default () => {
  const item_store = LocalStorage('item', { toServer })
  item_store.getAll = () => item_store.getPage({ per_page: 1e9 })?.items || []
  item_store.getAll().forEach((i) => item_store.save(i))
  item_store.getItems = () => item_store.getAll().filter((i) => i.class === 'item')
  item_store.getGrid = () => {
    const items = item_store.getItems()
    const hist = {}
    items.forEach((item) => (hist[item.type] = (hist[item.type] || 0) + 1))
    const rows = [Item.packs, Item.beams, Item.abilities].map((slugs) => {
      return slugs.map((slug) => ({
        slug,
        class: ['sm-item', slug, { has: hist[slug] }],
      }))
    })
    rows[0].forEach((cell) => {
      if (['missle', 'super-missle', 'power-bomb'].includes(cell.slug)) {
        cell.count = hist[cell.slug] * 5
      } else if (['energy-tank', 'reserve-tank'].includes(cell.slug)) {
        cell.count = hist[cell.slug]
      }
    })
    return rows
  }
  window.exportData = item_store.exportData = () => {
    const data = {}
    item_store.getItems().forEach((i) => (data[i.id] = i))
    downloadJson(data, 'items.json')
  }

  return item_store
}
