import ToolStorage from '@/components/unrest/ToolStorage'
import { LAYER_NAMES, INITIAL_LAYERS } from './ConfigPopper.vue'

export default (component) => {
  const getTools = () => {
    const tools = [
      {
        slug: 'settings_open',
        icon: 'fa fa-cogs',
        select: ToolStorage.TOGGLE,
      },
      { slug: 'select', icon: 'fa fa-mouse-pointer' },
      {
        icon: ' sm-item -missile',
        slug: 'vanilla',
      },
      {
        icon: ' sm-map -egg',
        slug: 'randomizer',
      },
    ]
    if (component.$auth.user?.is_superuser) {
      return [
        ...tools,
        { slug: 'move_zone', icon: 'fa fa-object-group' },
        { slug: 'move_room', icon: 'fa fa-th' },
        { slug: 'edit_room', icon: 'fa fa-edit' },
        {
          slug: 'elevator',
          icon: (_t, v) => `sm-elevator -${v}`,
          variants: ['brinstar', 'tourian', 'maridia', 'norfair', 'line'],
        },
        {
          slug: 'video_path',
          icon: 'fa fa-youtube-play',
        },
        {
          slug: 'run_path',
          icon: 'fa fa-gamepad',
        },
        {
          slug: 'rando_edit',
          icon: 'sm-item -speed-booster',
        },
      ]
    }
    return tools
  }

  const initial = INITIAL_LAYERS
  const storage = ToolStorage('tools__dread', { tools: getTools, initial })
  if (component.$route.params.world_slug.startsWith('grand-prix')) {
    const target_settings = {
      show_bts: false,
      'show_layer-1': true,
      show_rooms: false,
      show_walls: false,
      show_plm_enemies: false,
    }
    const changed = []
    Object.entries(target_settings).forEach(([key, value]) => {
      if (storage.state[key] !== value) {
        changed.push(key)
        storage.state[key] = value
      }
    })
  }
  storage.getVisibleLayers = () => LAYER_NAMES.filter((n) => storage.state[`show_${n}`])
  storage.all_layers = LAYER_NAMES

  return storage
}
