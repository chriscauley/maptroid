import BlockEntity from './BlockEntity'
import BaseEntity from './BaseEntity'
import { getIcon } from '../useAssets'
import { ITEM_GROUP } from '../constants'

export default class ItemEntity extends BaseEntity {
  constructor(options) {
    options.collisionGroup = ITEM_GROUP
    super(options)
    this.is_item = true
    if (options.modifier) {
      this.makeCoverBlock(options)
    }
  }
  reset() {}
  draw(_ctx) {
    const fname = `items${this.game.frame % 8 < 4 ? '' : '-alt'}`
    this.room.drawOnFg(getIcon(fname, this.type), this)
  }
  onCollide = (_player, _result) => {
    this.room.drawOnFg(null, this)
    this.game.removeEntity(this)
  }

  makeCoverBlock(options) {
    const { x, y, width, height, room, modifier } = options
    const type = modifier === 'inegg' ? 'egg' : 'shot'
    this.block = new BlockEntity({
      x,
      y,
      width,
      height,
      room,
      type,
      onDestroy: () => this.game.foregroundEntity(this),
      onRegrow: () => this.game.backgroundEntity(this),
      regrow: type === 'egg' ? undefined : 300,
    })
    this.game.backgroundEntity(this)
  }
}
