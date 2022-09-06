import { startCase } from 'lodash'
import auth from '@unrest/vue-auth'
import { RestStorage } from '@unrest/vue-storage'

import DreadItems from '@/models/DreadItems'

const fromServer = (item) => {
  if (item.data.bounds) {
    // TODO normalize dread
    item.attrs = {
      title: DreadItems.getName(item),
      class: DreadItems.getClass(item.data.type),
    }
  } else {
    item.attrs = {
      title: startCase(item.data.type),
      class: [`sm-item -${item.data.type}`, item.data.hidden && '-hidden'],
    }
    if (auth.user?.is_superuser) {
      item.attrs.title += ' ' + item.id
    }
    if (item.data.duplicate) {
      /* DEPRECATED */
      item.attrs.class.push('-duplicate')
    }
    if (item.data.duplicate_of) {
      item.attrs.title += ' (duplicate)'
      item.attrs.class.push('-duplicate_of')
    }
  }
  item.attrs.id = `item__${item.id}`
  return item
}

const collection_slug = 'schema/item'

export default () => {
  const storage = RestStorage('schema/item', { collection_slug, fromServer })
  return storage
}
