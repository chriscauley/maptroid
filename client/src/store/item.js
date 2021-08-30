import Store from './Store'
import Item from '@/models/Item'
import initial from '@/../public/sm/item.json'

export default () => {
  const item_store = Store('item', initial)
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
  return item_store
}
