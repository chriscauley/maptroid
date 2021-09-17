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
    })
    store.item.getAll().forEach((item) => store.item.save(item))
  },
  moveEnergyRoom: (store) => {
    // this room is shifted in the image. Temporarily moving it.
    const room = store.room.getOne(30)
    room.xys = [[38 - 2 / 16, 38]]
    store.room.save(room)
  },
  makeWorld(store) {
    // since I don't have a generic interface for adding new worlds this will do for now
    if (store.world.getPage().items.length) {
      throw 'Super metroid has already been added!'
    }
    store.world.save({
      name: 'Super Metroid',
      dzi: 'SuperMetroidMapZebes.dzi',
      W: 66, // 16896px / 256
      H: 56, // 14336px / 256
    })
  },
  migrateItems(store) {
    store.item.getAll().forEach((item) => {
      const { x, y } = item
      item.world_xy = [Math.floor(x / 256), Math.floor(y / 256)]
      item.screen_xy = [(x % 256) / 16, (y % 256) / 16]
      delete item.x
      delete item.y
      delete item.map_xy
      delete item.world_index
      console.warn('TODO save items after migration')
    })
  },
  moveItems(store) {
    // x=6, y=18
    // I had to move all tiems in ascent because the map wasn't aligned right
    store.item
      .getAll()
      .filter((i) => i.world_id === 4)
      .forEach((i) => {
        // I shifted the map 28, 26 pixels, item size is 2 px so move each 14,13
        i.screen_xy[0] -= 1
        i.screen_xy[1] -= 1

        // this put almost all items in a different room
        if (i.screen_xy[0] < 0) {
          i.screen_xy[0] += 16
          i.world_xy[0] -= 1
        }
        if (i.screen_xy[1] < 0) {
          i.screen_xy[1] += 16
          i.world_xy[1] -= 1
        }
        store.item.save(i)
      })
  },
}
