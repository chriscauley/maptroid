import { ReactiveLocalStorage } from '@unrest/vue-storage'

const actions = {
  shape: {
    mousedown(storage, mouse) {
      storage.patch({ tool_state: { x: mouse.x, y: mouse.y } })
    },
    mousemove(storage, mouse) {
      const { x, y } = storage.tool_state
      const width = mouse.x - x
      const height = mouse.y - y
      storage.patch({ tool_state: { x, y, width, height } })
    },
    mouseup(storage, mouse) {
      const { x, y, width, height } = storage.tool_state
      createBox()
    },
  },
}

export default (LS_KEY) => {
  const icon_map = {
    rect: 'fa fa-square-o',
    ellipsis: 'fa fa-circle-o',
    freeform: 'fa fa-area-chart',
  }

  const tools = [
    { name: 'Select', icon: 'fa fa-mouse-pointer' },
    { slug: 'shape', icon: 'fa fa-area-chart', variants: ['rect', 'ellipse', 'freeform'] },
  ]

  const makeTool = ({ state, patch }, { slug, name, variants = [], icon, actions }) => {
    const { selected_tool, selected_variant } = state
    const variant_selected = !variants.length || variants.includes(selected_variant)
    const selected = slug === selected_tool && variant_selected

    return {
      slug,
      icon,
      name: name || slug[0].toUpperCase() + slug.slice(1),
      class: `btn ${selected ? '-primary' : '-secondary'}`,
      click: () => patch({ selected_tool: slug, selected_variant: variants[0] }),
      children: variants?.map((child_slug) => ({
        slug: child_slug,
        icon: icon_map[child_slug] || `fa fa-${child_slug}`,
        class: ['btn', selected_variant === child_slug ? '-primary' : '-secondary'],
        click: () => patch({ selected_tool: slug, selected_variant: child_slug }),
      })),
    }
  }

  const storage = ReactiveLocalStorage({ LS_KEY })
  storage.listTools = () => tools.map((tool) => makeTool(storage, tool))
  storage.patch = (data) => Object.assign(storage.state, data)
  return storage
}
