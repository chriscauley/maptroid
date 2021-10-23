import { RestStorage } from '@unrest/vue-storage'

const fromServer = (screenshot) => {
  screenshot.key = `screenshot__${screenshot.id}`
  screenshot.data.human = screenshot.data.human || {}
  screenshot.data.human.entities = screenshot.data.human.entities || {}
  delete screenshot.data.human.items
  return screenshot
}

export default () => {
  const storage = RestStorage('schema/screenshot', {
    collection_slug: 'schema/screenshot',
    fromServer,
  })

  storage.setItemAtXY = (screenshot, x, y, type) => {
    screenshot.data.human.entities[[x, y]] = type
  }
  return storage
}
