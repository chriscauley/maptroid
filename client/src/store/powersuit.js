import { defaults } from 'lodash'
import { RestStorage } from '@unrest/vue-storage'

const collection_slug = 'schema/power-suit'

const fromServer = (ps) => {
  ps = defaults(ps.data, { indexes: [] })
  return ps
}

export default () => {
  const storage = RestStorage('schema/power-suit', { collection_slug, fromServer })
  return storage
}
