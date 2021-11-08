import { range } from 'lodash'
import DreadItems from '@/models/DreadItems'

import ToolStorage from '@/components/unrest/ToolStorage'

const color_names = Object.keys(DreadItems.colors)

const tools = [
  { slug: 'ss_move', getIcon: () => 'fa fa-puzzle-piece' },
  { slug: 'ss_trash', getIcon: () => 'fa fa-trash' },
  {
    slug: 'ss_group',
    getIcon: (_, variant) => `fa fa-object-group -group-${variant}`,
    variants: range(9),
  },
  { slug: 'room_bounds', getIcon: () => 'fa fa-edit' },
  { slug: 'room_colors', getIcon: (_, v) => `room-color -color-${v}`, variants: color_names },
  { slug: 'room_item_trash', getIcon: () => 'fa fa-trash' },
]

Object.entries(DreadItems.type_map).forEach(([_name, variants]) => {
  // TODO makeCss should be inside a component. Maybe tools needs an init function?
  DreadItems.makeCss() // idempotent
  tools.push({
    slug: 'room_item',
    variants,
    getIcon: (i, v) => DreadItems.getClass(v),
  })
})

export default ToolStorage('tools__dread', { tools })
