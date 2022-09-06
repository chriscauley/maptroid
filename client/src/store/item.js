import { startCase } from 'lodash'
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
      class: [`sm-item -${item.data.type}`],
    }
    if (item.data.duplicate) {
      item.attrs.title += ' (duplicate)'
      item.attrs.class.push('-duplicate')
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
