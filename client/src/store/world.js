import { LocalStorage } from '@unrest/vue-storage'

import downloadJson from '@/lib/downloadJson'
import prepareItem from './prepareItem'

import World from '@/models/World'

const fromServer = (data) => new World(data)
const toServer = (data) => (data.toJson ? data.toJson() : data)

export default () => {
  const world_store = LocalStorage('world', { prepareItem, fromServer, toServer })
  window.exportWorld = world_store.exportWorld = () => {
    const data = {}
    world_store.getAll().forEach((i) => (data[i.id] = i))
    downloadJson(data, 'world.json')
  }

  return world_store
}
