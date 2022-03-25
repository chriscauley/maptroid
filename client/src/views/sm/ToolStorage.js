import ToolStorage from '@/components/unrest/ToolStorage'
import { LAYER_NAMES } from './ConfigPopper.vue'
import portal_colors from '@/../../server/static/sm/portal/colors.json'

export default (component) => {
  const getTools = () => {
    const tools = [
      {
        slug: 'settings_open',
        icon: 'fa fa-cogs',
        select: ToolStorage.TOGGLE,
      },
    ]
    if (component.$auth.user?.is_superuser) {
      return [
        ...tools,
        { slug: 'select', icon: 'fa fa-mouse-pointer' },
        { slug: 'move_zone', icon: 'fa fa-object-group' },
        { slug: 'move_room', icon: 'fa fa-chess-board' },
        { slug: 'edit_room', icon: 'fa fa-edit' },
        {
          slug: 'elevator',
          icon: (_t, v) => `sm-elevator -${v}`,
          variants: ['brinstar', 'tourian', 'maridia', 'norfair', 'line'],
        },
        {
          slug: 'portal',
          icon: (_t, v) => `sm-portal -${v}`,
          variants: Object.keys(portal_colors),
        },
        {
          slug: 'video_path',
          icon: 'fab fa-youtube',
        },
        {
          slug: 'run_path',
          icon: 'fas fa-dice',
        },
      ]
    }
    return tools
  }
  const storage = ToolStorage('tools__dread', { tools: getTools })
  storage.getVisibleLayers = () => LAYER_NAMES.filter((n) => storage.state[`show_${n}`])
  storage.all_layers = LAYER_NAMES

  return storage
}
