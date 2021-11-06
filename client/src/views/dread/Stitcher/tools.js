import { range } from 'lodash'

import ToolStorage from '@/components/unrest/ToolStorage'

const tools = [
  { slug: 'ss_move', getIcon: () => 'fa fa-puzzle-piece' },
  { slug: 'ss_trash', getIcon: () => 'fa fa-trash' },
  {
    slug: 'ss_group',
    getIcon: (_, variant) => `fa fa-object-group -group-${variant}`,
    variants: range(9),
  },
  { slug: 'room', getIcon: () => 'fa fa-edit' },
]

export default ToolStorage('tools__dread', { tools })
