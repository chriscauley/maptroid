import fields from '@/models/fields'

const item = {
  schema: {
    type: 'object',
    properties: {
      type: { type: 'string' },
      class: { type: 'string' },
      width: { type: 'number' },
      height: { type: 'number' },
      world_xy: fields.xy,
      screen_xy: fields.xy,
      room_id: { type: 'number' },
    },
  },
  list_display: [
    'class',
    'type',
    function world(item, store) {
      return store.getModel('main', 'world').getOne(item.world_id)?.name
    },
    function room(item, store) {
      const room = store.getModel('main', 'room').getOne(item.room_id) || {}
      return room.name || `#${room?.id || '???'}`
    },
  ],
}

const world = {
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      dzi: { type: 'string' },
      map_screen_size: { type: 'number' },
      map_item_size: { type: 'number' },
      zones: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      custom_items: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  },
}

export default { item, world }
