import { debounce } from 'lodash'

import { RestStorage } from '@unrest/vue-storage'

const fromServer = (screenshot) => {
  screenshot.key = `screenshot__${screenshot.id}`
  screenshot.data.human = screenshot.data.human || {}
  screenshot.data.human.entities = screenshot.data.human.entities || {}
  return screenshot
}

export default () => {
  const storage = RestStorage('schema/screenshot', {
    collection_slug: 'schema/screenshot',
    fromServer,
  })

  const _save = debounce(storage.save, 1000)

  storage.setItemAtXY = (screenshot, xy, type) => {
    const current = screenshot.data.human.entities[xy]
    if (type === null) {
      delete screenshot.data.human.entities[xy]
      _save(screenshot)
    } else if (current !== type) {
      screenshot.data.human.entities[xy] = type
      _save(screenshot)
    }
  }
  return storage
}
