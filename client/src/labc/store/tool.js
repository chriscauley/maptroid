import { ReactiveLocalStorage } from '@unrest/vue-storage'

const Box = {
  variants: ['moss', 'steel', 'magnite', 'lock'],
}

const tools = [
  { name: 'Select', icon: 'fa fa-mouse-pointer' },
  { slug: 'shape', icon: 'fa fa-area-chart' },
  { slug: 'box', variants: Box.variants, icon: 'fa fa-square-o' },
]

const makeTool = ({ state, patch }, { slug, name, variants = [], icon }) => {
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
      icon: `sm-${slug} -${child_slug}`,
      class: ['btn', selected_variant === child_slug ? '-primary' : '-secondary'],
      click: () => patch({ selected_tool: slug, selected_variant: child_slug }),
    })),
  }
}

export default () => {
  const storage = ReactiveLocalStorage({ LS_KEY: 'editor_tools' })

  storage.listTools = () => tools.map((tool) => makeTool(storage, tool))
  storage.patch = (data) => Object.assign(storage.state, data)
  return storage
}
