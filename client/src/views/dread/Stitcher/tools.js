import { range } from 'lodash'

import ToolStorage from '@/components/unrest/ToolStorage'

const room_icons = {
  edit: 'fa fa-edit',
  move: 'fa fa-arrows',
  resize: 'fa fa-arrows-alt',
}

const tools = [
  { slug: 'select', getIcon: () => 'fa fa-mouse-pointer' },
  { slug: 'rearrange_background', getIcon: () => 'fa fa-puzzle-piece' },
  {
    slug: 'group',
    getIcon: (_, variant) => `fa fa-object-group -group-${variant}`,
    variants: range(9),
  },
  { slug: 'trash', getIcon: () => 'fa fa-trash' },
  { slug: 'room', variants: ['edit', 'resize', 'move'], getIcon: (_, v) => room_icons[v] },
]

export default ToolStorage('tools__dread', { tools })
