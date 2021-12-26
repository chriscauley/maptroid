import colors from '@/lib/dread_colors'
import { startCase } from 'lodash'

const items = [
  'missile__tank',
  'missile__plus-tank',
  'energy__part',
  'energy__tank',
  'power-bomb',
  'item__sphere',
  'item__cube',
  'boss',
  'central-unit',
  'samus',
]

const stations = [
  'interactive-device',
  'station__ammo-recharge',
  'station__energy-recharge',
  'station__total-recharge',
  'station__network',
  'station__map',
  'station__save',
]

const transit = [
  'transit__elevator',
  'transit__shuttle',
  'transit__transport-capsule',
  'teleportal__blue',
  'teleportal__cyan',
  'teleportal__green',
  'teleportal__orange',
  'teleportal__purple',
  'teleportal__red',
  'teleportal__yellow',
]

const blocks = [
  'block__void',
  'grapple-swing-point',
  'morphball-launcher-exit',
  'morphball-launcher',
  'block__grapple-beam',
  'box__grapple-beam',
  'box__storm-missile',
  'box__wide-beam',
  'cover__plasma-beam',
  'cover__missile',
  'cover__super-missile',
  'cover__wave-beam',
  'door__wide-beam',
]

const doors = [
  'door__central-unit',
  'door__grapple-beam',
  'door__emmi-zone',
  'door__charge-beam',
  'door__power-beam',
  'door__shutter',
  'door__thermal',
  'door__access-closed',
  'box__enky',
  'door__sensor-lock',
  'door__shutter-platform',
  'door__thermal-trapdoor',
]

const all = [...items, ...stations, ...transit, ...blocks, ...doors]

const makeCss = () => {
  const id = 'dread-items-css'
  if (document.getElementById(id)) {
    return
  }
  const head = document.head || document.getElementsByTagName('head')[0]
  const style = document.createElement('style')
  style.id = id

  head.appendChild(style)

  const lines = all.map((slug) => {
    const url = `/static/dread/icons/${slug}.png`
    return `.dread-icon.-type-${slug}:before { background-image: url("${url}") }`
  })
  Object.entries(colors).forEach(([name, color]) => {
    lines.push(`.room-color.-color-${name} { --dread-color: ${color} }`)
  })
  style.type = 'text/css'
  style.appendChild(document.createTextNode(lines.join('\n')))
}

const name_cache = {
  // These pre-defined names act as overridse
  'door__shutter-platform': 'Shutter Platform',
  'door__thermal-trapdoor': 'Thermal Trapdoor',
  transit__elevator: 'Elevator',
  transit__shuttle: 'Shuttle',
  'transit__transport-capsule': 'Transport Capsule',
  missile__tank: 'Missile Tank',
  'missile__plus-tank': 'Missile + Tank',
  energy__part: 'Energy Part',
  energy__tank: 'Energy Tank',
  'power-bomb': 'Power Bomb',
  item__sphere: 'Item Sphere',
  item__cube: 'Item Cube',
  boss: 'Boss',
  'central-unit': 'Central Unit',
}

const getClass = (slug) => {
  const type = slug.split('__')[0]
  return `dread-icon -type-${type} -type-${slug}`
}

const getName = (item) => {
  if (typeof item === 'string') {
    return getName({ data: { type: item } })
  }
  if (item.data.name) {
    return item.data.name
  }
  const type = item.data.type
  if (!name_cache[type]) {
    const [a, b = ''] = type.split('__')
    name_cache[type] = startCase(`${b}-${a}`)
  }
  return name_cache[type]
}

const _visible = {}
items.forEach((i) => (_visible[i] = true))

// Display a lmimited subset of items for non-superuser
const allowed_types = [...items, ...stations, ...transit]
const allowed_by_type = Object.fromEntries(allowed_types.map((t) => [t, true]))

export default {
  all,
  colors,
  items,
  stations,
  transit,
  blocks,
  doors,
  _visible,
  getName,
  getClass,
  type_map: { items, stations, transit, blocks, doors },
  makeCss,
  filterDisplayItems: (items, user) => {
    // TODO normalize dread
    if (!user?.is_superuser) {
      return items.filter((i) => allowed_by_type[i.data.type])
    }
    return items
  },
  prepDisplayItems(display_items) {
    return display_items.map((item) => ({
      ...item,
      title: getName(item),
      class: getClass(item.data.type),
    }))
  },
  groupItems(world_items, actions) {
    const bins = {}
    const type_by_id = {}

    world_items
      .filter((i) => _visible[i.data.type])
      .forEach((i) => (type_by_id[i.id] = i.data.type))
    actions.forEach((action) => {
      const type = type_by_id[action[0]]
      bins[type] = (bins[type] || 0) + 1
    })

    const items = _visible.map((type) => ({
      type,
      count: bins[type],
      icon: getClass(type),
    }))
    items.push({
      type: 'missiles__computed',
      count: 15 + 2 * (bins.missile__tank || 0) + 10 * (bins['missile__plus-tank'] || 0),
      icon: getClass('missile__tank'),
    })
    items.push({
      type: 'energy__tank',
      count: (bins.energy__tank || 0) + Math.floor((bins.energy__part || 0) / 4),
      icon: getClass('energy__tank'),
    })
    return items
  },
}
