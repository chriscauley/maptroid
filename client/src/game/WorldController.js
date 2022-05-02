import RoomController from './RoomController'
import ZoneController from './ZoneController'

export default class WorldController {
  constructor(options) {
    const { world, rooms, zones, game } = options
    const { name, slug } = world
    this.json = world
    this.id = world.id
    Object.assign(this, { rooms, zones, game, name, slug })
    this.zone_map = {}
    this.room_map = {}
    this.xys_by_room_id = {}
    this.xy0_by_room_id = {} // room offset, not necessarily a part of the room
    this.zone_by_id = {}
    this.room_by_id = {}

    this.zones.forEach((z) => (this.zone_by_id[z.id] = new ZoneController(z, this)))

    this.rooms.forEach((room_json) => {
      const room_id = room_json.id
      const zone = this.zone_by_id[room_json.zone]
      const [room_x, room_y] = room_json.data.zone.bounds
      const [zone_x, zone_y] = zone.json.data.world.bounds
      this.xys_by_room_id[room_id] = []
      this.xy0_by_room_id[room_id] = [zone_x + room_x, -(zone_y + room_y)] // YFLIP

      const room = new RoomController(room_json, this)
      this.room_by_id[room_id] = room
      room_json.data.geometry.screens.forEach(([screen_x, screen_y]) => {
        const xy = [room_x + zone_x + screen_x, -(room_y + zone_y + screen_y)] // YFLIP
        if (this.room_map[xy]) {
          console.warn(`Conflicting room at ${xy}`)
        }
        this.xys_by_room_id[room_id].push(xy)
        this.room_map[xy] = room
        this.zone_map[xy] = zone
      })
    })
  }

  getRoomAtXY(xy) {
    return this._room_map[xy]
  }
}
