import { debounce } from 'lodash'

import { RestStorage } from '@unrest/vue-storage'

const fromServer = (screenshot) => {
  screenshot.key = `screenshot__${screenshot.id}`
  // TODO is data.human still in use? I think that was just part of the unfinished "analyzer"
  screenshot.data.human = screenshot.data.human || {}
  screenshot.data.human.entities = screenshot.data.human.entities || {}
  return screenshot
}

export default () => {
  const storage = RestStorage('schema/screenshot', {
    collection_slug: 'schema/screenshot',
    fromServer,
  })

  const _bounce_cache = {}
  const bounceSave = (storage.bounceSave = (screenshot) => {
    if (!_bounce_cache[screenshot.id]) {
      _bounce_cache[screenshot.id] = debounce((s) => storage.save(s), 1000)
    }
    _bounce_cache[screenshot.id](screenshot)
  })

  storage.setItemAtXY = (screenshot, xy, type) => {
    const current = screenshot.data.human.entities[xy]
    if (type === null) {
      delete screenshot.data.human.entities[xy]
      bounceSave(screenshot)
    } else if (current !== type) {
      screenshot.data.human.entities[xy] = type
      bounceSave(screenshot)
    }
  }

  return storage
}
