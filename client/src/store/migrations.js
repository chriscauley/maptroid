export default {
  locateItems(store) {
    // give the rooms an room_id and map_xy
    const room_id_by_xy = {}
    store.room.getAll().forEach((room) => {
      room.xys.forEach((xy) => (room_id_by_xy[xy] = room.id))
    })
    store.item.getAll().forEach((item) => {
      const { x, y } = item
      const map_xy = [x, y].map((i) => Math.floor(i / 256))
      item.room_id = room_id_by_xy[map_xy]
      item.map_xy = [x, y]
      if (!item.room_id) {
        console.error(item)
        throw `Unable to find room for item #${item.id} - ${item.name}`
      }
      store.item.save(item)
    })
  },
}
