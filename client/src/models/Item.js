import mod from '@/lib/mod'
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
  'grappling-hook',
]

const misc = ['pedastool', 'energy2-tank']

const all = [...abilities, ...packs, ...beams, ...misc]

const Item = {
  getMapBounds(item, world) {
    const [world_x, world_y] = item.world_xy
    const [screen_x, screen_y] = item.screen_xy
    const { map_screen_size, map_item_size } = world
    // TODO this makes the item fill the whole room
    // if (item.class === 'item') {
    //   return {
    //     x: world_x * map_screen_size,
    //     y: world_y * map_screen_size,
    //     width: map_screen_size,
    //     height: map_screen_size,
    //   }
    // }
    const width = item.width * map_item_size
    const height = item.height * map_item_size
    const x = world_x * map_screen_size + screen_x * map_item_size
    const y = world_y * map_screen_size + screen_y * map_item_size
    return { x, y, width, height }
  },
  getOutOfBoundsFix(item) {
    const screen_xy = item.screen_xy.slice()
    const world_xy = item.world_xy.slice()
    const dimensions = [0, 1]
    let bad
    dimensions.forEach((i_xy) => {
      if (screen_xy[i_xy] < 0) {
        world_xy[i_xy] -= 1
        bad = true
      } else if (screen_xy[i_xy] >= 15) {
        world_xy[i_xy] += 1
        bad = true
      }
      screen_xy[i_xy] = mod(screen_xy[i_xy], 16)
    })
    return (
      bad && {
        item,
        screen_xy,
        world_xy,
        id: item.id,
        x: screen_xy[0] / 16 + world_xy[0],
        y: screen_xy[1] / 16 + world_xy[1],
        width: 1 / 16,
        height: 1 / 16,
        class: 'oob-fix',
      }
    )
  },
  all,
  abilities,
  packs,
  beams,
  misc,
  groupItems(world, world_items, actions) {
    const totals = countBy(world_items, 'data.type')
    const items_by_id = {}
    world_items.forEach((i) => (items_by_id[i.id] = i))
    const acquired_types = actions
      .filter((a) => a[0] === 'item')
      .map((a) => items_by_id[a[1]]?.data.type)
      .filter(Boolean)
    const acquired_counts = countBy(acquired_types)

    const prepItem = (type) => ({
      type,
      icon: `sm-item -${type}`,
      // TODO find a better way to hide totals rather than just > 2
      text: totals[type] > 2 ? `${acquired_counts[type]}/${totals[type]}` : '',
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
