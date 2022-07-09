import { countBy } from 'lodash'

const abilities = [
  'varia-suit',
  'gravity-suit',
  'morph-ball',
  'bomb',
  'spring-ball',
  'hi-jump-boots',
  'speed-booster',
  'space-jump',
  'screw-attack',
]

const packs = ['missile', 'super-missile', 'power-bomb', 'energy-tank', 'reserve-tank', 'confused']

const beams = [
  'charge-beam',
  'ice-beam',
  'wave-beam',
  'spazer-beam',
  'plasma-beam',
  'x-ray',
  'grappling-beam',
]

const misc = ['pedastool', 'energy2-tank']

const all = [...abilities, ...packs, ...beams, ...misc]

const Item = {
  all,
  abilities,
  packs,
  beams,
  misc,
  groupItems(world, world_items, actions) {
    const totals = countBy(world_items.filter(i => !i.data.duplicate), 'data.type')
    const items_by_id = {}
    world_items.forEach((i) => (items_by_id[i.id] = i))
    const acquired_types = actions
      .filter((a) => a[0] === 'item')
      .map((a) => items_by_id[a[1]]?.data.type)
      .filter(Boolean)
    const acquired_counts = countBy(acquired_types)

    const prepItem = (type) => ({
      type,
      icon: [`sm-item -${type}`, acquired_counts[type] ? '-has' : '-has-not'],
      // TODO find a better way to hide totals rather than just > 1
      text: totals[type] > 1 ? `${acquired_counts[type] || 0}/${totals[type]}` : '',
    })
    const groups = ['packs', 'beams', 'abilities'].map((group_name) => ({
      name: group_name,
      items: Item[group_name].filter((i) => totals[i]).map(prepItem),
    }))
    if (world.data.extra_items) {
      groups.push({
        name: 'extra',
        items: world.data.extra_items.map(prepItem),
      })
    }
    return groups
  },
}

export default Item
