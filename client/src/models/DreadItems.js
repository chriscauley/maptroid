import colors from '@/lib/dread_colors'

const items = [
  'missile__tank',
  'missile__plus-tank',
  'power-bomb',
  'energy__tank',
  'energy__part',
  'item__sphere',
  'item__cube',
  'boss',
  'central-unit',
  'grapple-swing-point',
  'morphball-launcher-exit',
  'morphball-launcher',
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
  'teleportal__green',
  'teleportal__orange',
  'teleportal__red',
  'teleportal__purple',
  'teleportal__yellow',
  'teleportal__blue',
  'teleportal__cyan',
]

const blocks = [
  'block__void',
  'block__grapple-beam',
  'box__enky',
  'box__storm-missile',
  'box__wide-beam',
  'cover__plasma-beam',
  'cover__missile',
  'cover__super-missile',
  'cover__wave-beam',
  'box__grapple-beam',
]

const doors = [
  'door__central-unit',
  'door__grapple-beam',
  'door__emmi-zone',
  'door__charge-beam',
  'door__power-beam',
  'door__sensor-lock',
  'door__shutter',
  'door__shutter-platform',
  'door__thermal',
  'door__thermal-trapdoor',
  'door__closed-thermal',
  'door__wide-beam',
  'door__access-closed',
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
    const url = `/static/dread/icons/${slug.replace('__', '/')}.png`
    return `.dread-icon.-type-${slug}:before { background-image: url("${url}") }`
  })
  Object.entries(colors).forEach(([name, color]) => {
    lines.push(`.room-color.-color-${name} { --dread-color: ${color} }`)
  })
  style.type = 'text/css'
  style.appendChild(document.createTextNode(lines.join('\n')))
}

export default {
  colors,
  items,
  stations,
  transit,
  blocks,
  doors,
  type_map: { items, stations, transit, blocks, doors },
  makeCss,
  getClass: (item) => {
    const type = item.split('__')[0]
    return `dread-icon -type-${type} -type-${item}`
  },
}
