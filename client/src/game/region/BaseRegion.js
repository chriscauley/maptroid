import { GROUP } from '../constants'
import p2 from 'p2'

const colors = {
  exit: 'rgba(255, 128, 128, 0.5)',
  door_front: 'rgba(128, 255, 128, 0.5)',
  door_back: 'rgba(128, 128, 255, 0.5)',
}

export default class BaseRegion {
  constructor(options) {
    const { x, y, width, height, room, type } = options
    Object.assign(this, { x, y, width, height, room, type })
    this.game = room.game
    this.created = this.game.frame
    this.options = options
    this.makeBody()
    this.game.bindEntity(this)
  }

  makeBody() {
    const { x, y, width, height } = this.options
    const collisionGroup = GROUP.region
    const shape = new p2.Box({ collisionGroup, width, height })
    shape._color = colors[this.type]
    this.body = new p2.Body({ position: [x, y] })
    this.body.addShape(shape)
    this.body.updateAABB()
  }

  draw(ctx) {
    const s = this.body.shapes[0]
    ctx.fillRect(-s.width / 2, -s.height / 2, s.width, s.height)
  }

  tick() {}
}