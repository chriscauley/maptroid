import { LocalStorage } from '@unrest/vue-storage'
import downloadJson from '@/lib/downloadJson'
// import items_json from '../../public/sm/items.json'

import prepareItem from './prepareItem'
import Item from '@/models/Item'

export default () => {
  const item_store = LocalStorage('item', { prepareItem })
  item_store.getAll = () => item_store.getPage({ per_page: 1e9 })?.items || []
  item_store.getItems = () => item_store.getAll().filter((i) => i.class === 'item')
  item_store.getGrid = () => {
    const items = item_store.getItems()
    const hist = {}
    items.forEach((item) => (hist[item.type] = (hist[item.type] || 0) + 1))
    const rows = [Item.packs, Item.beams, Item.abilities].map((slugs) => {
      return slugs.map((slug) => ({
        slug,
        class: [`sm-item -${slug}`, { has: hist[slug] }],
      }))
    })
    rows[0].forEach((cell) => {
      if (['missile', 'super-missile', 'power-bomb'].includes(cell.slug)) {
        cell.count = hist[cell.slug] * 5
      } else if (['energy-tank', 'reserve-tank'].includes(cell.slug)) {
        cell.count = hist[cell.slug]
      }
    })
    return rows
  }
  window.exportData = item_store.exportData = () => {
    const data = {}
    item_store.getAll().forEach((i) => (data[i.id] = i))
    downloadJson(data, 'items.json')
  }

  return item_store
}
