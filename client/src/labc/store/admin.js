const world = {
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
    },
  },
}

const room = {
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
    },
  },
  list_display: [
    'name',
    {
      name: 'editMap',
      get: (item) => ({
        tagName: 'router-link',
        attrs: {
          class: 'fa fa-map-o',
          to: `/room/edit/${item.id}/`,
        },
      }),
    },
  ],
}

export default { room, world }
