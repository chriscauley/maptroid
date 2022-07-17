import { ReactiveLocalStorage } from '@unrest/vue-storage'
import startCase from 'lodash.startcase'

const _getIcon = (tool, variant) => {
  return `-tool_${tool} -variant_${variant}`
}

const ToolStorage = (LS_KEY, { tools, initial = {} }) => {
  initial = { selected: {}, ...initial }
  const storage = ReactiveLocalStorage({ LS_KEY, initial })

  const makeTool = (options) => {
    if (options.getIcon) {
      throw 'DEPRECATED: Use icon instead of getIcon'
    }
    const { slug, name, variants = [], icon = _getIcon, items } = options

    const select = (tool_slug, variant) => {
      if (typeof options.select === 'function') {
        options.select(tool_slug, variant)
      } else if (options.select === TOGGLE) {
        storage.save({ [tool_slug]: !storage.state[tool_slug] })
      } else {
        storage.save({ selected: { tool: tool_slug, variant } })
      }
    }

    const getIcon = (t, v) => (typeof icon === 'function' ? icon(t, v) : icon)
    const { tool: selected_tool, variant: selected_variant } = storage.state.selected
    const variant_selected = !variants.length || variants.includes(selected_variant)
    const selected = slug === selected_tool && variant_selected
    const toggle_selected = options.select === TOGGLE && storage.state[slug]

    return {
      slug,
      icon: getIcon(selected_tool, variant_selected ? selected_variant : variants[0]),
      name: name || startCase(slug),
      class: `btn ${selected || toggle_selected ? '-primary' : '-secondary'}`,
      click: () => select(slug, variants[0]),
      variants,
      items,
      children: variants?.map((child_slug) => ({
        slug: child_slug,
        icon: getIcon(selected_tool, child_slug),
        class: ['btn', selected_variant === child_slug ? '-primary' : '-secondary'],
        click: () => select(slug, child_slug),
      })),
    }
  }

  storage.listTools = () => {
    const list = typeof tools === 'function' ? tools(storage) : tools
    return list.map(makeTool)
  }

  return storage
}

const TOGGLE = (ToolStorage.TOGGLE = 'TOGGLE')
export default ToolStorage
