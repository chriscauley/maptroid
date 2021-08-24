import { LocalStorage } from '@unrest/vue-storage'
import downloadJson from '@/lib/downloadJson'

import prepareItem from './prepareItem'

const migrations = { // eslint-disable-line
  moveEnergyRoom: (room_store) => {
    // this room is shifted in the image. Temporarily moving it
    const room = room_store.getOne(30)
    room.xys = [[38 - 2 / 16, 38]]
    room_store.save(room)
  },
}

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
