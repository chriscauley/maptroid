import { range } from 'lodash'
import DreadItems from '@/models/DreadItems'

import ToolStorage from '@/components/unrest/ToolStorage'

export default (component) => {
  // TODO makeCss should be inside component, not storage
  DreadItems.makeCss() // idempotent
  const { mode } = component.$route.query
  const color_names = Object.keys(DreadItems.colors)

  let tools = []
  if (mode === 'screenshots') {
    tools = [
      { slug: 'ss_move', getIcon: () => 'fa fa-puzzle-piece' },
      { slug: 'ss_trash', getIcon: () => 'fa fa-trash' },
      {
        slug: 'ss_group',
        getIcon: (_, variant) => `fa fa-object-group -group-${variant}`,
        variants: range(9),
      },
    ]
  } else if (mode === 'room') {
    tools = [
      { slug: 'room_bounds', getIcon: () => 'fa fa-edit' },
      { slug: 'room_link', getIcon: () => 'fa fa-link' },
      { slug: 'room_colors', getIcon: (_, v) => `room-color -color-${v}`, variants: color_names },
      { slug: 'room_item_trash', getIcon: () => 'fa fa-trash' },
    ]

    Object.entries(DreadItems.type_map).forEach(([_name, variants]) => {
      tools.push({
        slug: 'room_item',
        variants,
        getIcon: (i, v) => DreadItems.getClass(v),
      })
    })
  }
  const storage = ToolStorage('tools__dread', { tools })
  if (!storage.listTools().find((t) => t.slug === storage.state.selected_tool)) {
    // depending on the mode, the toolbar may not exist
    storage.save({ selected_tool: null, selected_variant: null })
  }

  return storage
}
