import { RestStorage } from '@unrest/vue-storage'

const fromServer = (room) => {
  room.data.plm_overrides = room.data.plm_overrides || {}
  return room
}

const collection_slug = 'schema/room'

export default () => {
  const storage = RestStorage('schema/room', { collection_slug, fromServer })
  return storage
}
