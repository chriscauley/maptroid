import ToolStorage from '@/components/unrest/ToolStorage'

/*
  TODO
  ability to toggle layers
  ability to open room popup
  only show rendered room canvas on room edit
  toggle moving zones
*/

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
      const { route } = component.$store
      return [
        ...tools,
        { slug: 'select', icon: 'fa fa-mouse-pointer' },
        { slug: 'move_zone', icon: 'fa fa-object-group' },
        {
          slug: 'links',
          icon: 'fa fa-map-marked',
          items: route.zones.map((z) => ({
            to: route.getZoneLink(route.world?.slug, z.slug),
            text: z.name,
          })),
        },
      ]
    }
    return tools
  }
  const storage = ToolStorage('tools__dread', { tools: getTools })

  return storage
}
