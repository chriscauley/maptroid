import { LocalStorage } from '@unrest/vue-storage'
import downloadJson from '@/lib/downloadJson'

import prepareItem from './prepareItem'

export default () => {
  const room_store = LocalStorage('room', { prepareItem })
  room_store.getAll = () => room_store.getPage({ per_page: 1e9 })?.items || []
  window.exportRoom = room_store.exportRoom = () => {
    const data = {}
    room_store.getAll().forEach((i) => (data[i.id] = i))
    downloadJson(data, 'room.json')
  }

  return room_store
}
