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

export default {
  all,
  colors,
  items,
  stations,
  transit,
  blocks,
  doors,
  getName,
  getClass,
  type_map: { items, stations, transit, blocks, doors },
  makeCss,
  prepDisplayItems(display_items, videos = []) {
    return display_items.map((item) => ({
      ...item,
      name: getName(item),
      icon: getClass(item.data.type),
      times_by_video_id: Object.fromEntries(videos.map((v) => [v.id, v.times_by_id[item.id]])),
    }))
  },
}
