import { ReactiveLocalStorage } from '@unrest/vue-storage'
import startCase from 'lodash.startcase'

// this is a general purpose too storage function
const ToolStorage = (LS_KEY, tools) => {
  const icon_map = {
    rect: 'fa fa-square-o',
    ellipsis: 'fa fa-circle-o',
    freeform: 'fa fa-area-chart',
  }

  const makeTool = ({ state, save }, { slug, name, variants = [], icon }) => {
    const { selected_tool, selected_variant } = state
    const variant_selected = !variants.length || variants.includes(selected_variant)
    const selected = slug === selected_tool && variant_selected

    return {
      slug,
      icon,
      name: name || startCase(slug),
      class: `btn ${selected ? '-primary' : '-secondary'}`,
      click: () => save({ selected_tool: slug, selected_variant: variants[0] }),
      children: variants?.map((child_slug) => ({
        slug: child_slug,
        icon: icon_map[child_slug] || `fa fa-${child_slug}`,
        class: ['btn', selected_variant === child_slug ? '-primary' : '-secondary'],
        click: () => save({ selected_tool: slug, selected_variant: child_slug }),
      })),
    }
  }

  const storage = ReactiveLocalStorage({ LS_KEY, initial: { selected_tool: tools[0]?.slug } })
  storage.listTools = () => tools.map((tool) => makeTool(storage, tool))
  return storage
}

const tools = [
  { slug: 'select', icon: 'fa fa-mouse-pointer' },
  { slug: 'rearrange_background', icon: 'fa fa-puzzle-piece' },
]

export default ToolStorage('tools__dread', tools)
