import { ReactiveLocalStorage } from '@unrest/vue-storage'
import startCase from 'lodash.startcase'

const defaultIcon = (tool, variant) => {
  return `-tool_${tool} -variant_${variant}`
}

export default (LS_KEY, { tools, getIcon = defaultIcon }) => {
  const makeTool = ({ state, save }, { slug, name, variants = [] }) => {
    const { selected_tool, selected_variant } = state
    const variant_selected = !variants.length || variants.includes(selected_variant)
    const selected = slug === selected_tool && variant_selected

    return {
      slug,
      icon: getIcon(slug, selected ? selected_variant : variants[0]),
      name: name || startCase(slug),
      class: `btn ${selected ? '-primary' : '-secondary'}`,
      click: () => save({ selected_tool: slug, selected_variant: variants[0] }),
      variants,
      children: variants?.map((child_slug) => ({
        slug: child_slug,
        icon: getIcon(selected_tool, child_slug),
        class: ['btn', selected_variant === child_slug ? '-primary' : '-secondary'],
        click: () => save({ selected_tool: slug, selected_variant: child_slug }),
      })),
    }
  }

  const initial = { selected_tool: tools[0]?.slug, selected_variant: tools[0]?.variants?.[0] }
  const storage = ReactiveLocalStorage({ LS_KEY, initial })
  storage.listTools = () => tools.map((tool) => makeTool(storage, tool))
  return storage
}
