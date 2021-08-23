import { LocalStorage } from '@unrest/vue-storage'
// import downloadJson from '@/lib/downloadJson'

import Item from '@/models/Item'

export default () => {
  const item_store = LocalStorage('item')
  // downloadJson(item_store.getPage({ per_page: 1e9}), 'items.json')
  item_store.getItems = () => item_store.getPage({ per_page: 1e9 })?.items || []
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
  return item_store
}
