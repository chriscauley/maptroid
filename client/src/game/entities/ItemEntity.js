import BlockEntity from './BlockEntity'
import BaseEntity from './BaseEntity'
import { getIcon } from '../useAssets'
import { ITEM_GROUP } from '../constants'

export default class ItemEntity extends BaseEntity {
  constructor(options) {
    options.collisionGroup = ITEM_GROUP
    super(options)
    this.is_item = true
    this.exists = true
    if (options.modifier) {
      this.makeCoverBlock(options)
    }
    this.game.setTimeout(() => {
      if (this.game.player.save_state.collected[options.item_id]) {
        this.game.removeEntity(this)
        this.exists = false

        const { modifier } = this.options
        if (modifier === 'inegg') {
          this.game.removeEntity(this.block)
        }
        if (modifier === 'inegg' || !modifier) {
          this.room.drawOnFg(null, this)
        }
      }
    }, 1)
  }
  reset() {}
  draw(_ctx) {
    if (this.exists) {
      const fname = `items${this.game.frame % 8 < 4 ? '' : '-alt'}`
      this.room.drawOnFg(getIcon(fname, this.type), this)
    }
  }

  onCollide = (player, _result) => {
    this.exists = false
    this.room.drawOnFg(null, this)
    player.collectItem({ id: this.options.item_id, type: this.type })
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
      onDestroy: () => this.exists && this.game.foregroundEntity(this),
      onRegrow: () => this.exits && this.game.backgroundEntity(this),
      regrow: type === 'egg' ? undefined : 300,
    })
    this.game.backgroundEntity(this)
  }
}