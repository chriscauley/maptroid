import { RestStorage } from '@unrest/vue-storage'

const fromServer = (data) => {
  data.key = `screenshot__${data.id}`
  return data
}

export default () => {
  const storage = RestStorage('schema/screenshot', {
    collection_slug: 'schema/screenshot',
    fromServer,
  })
  return storage
}
