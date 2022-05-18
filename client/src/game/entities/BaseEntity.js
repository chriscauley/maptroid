export default class BaseEntity {
  constructor(options) {
    const { x, y, max_hp = 1, hp = max_hp, regrow, room, type } = options
    Object.assign(this, { x, y, max_hp, hp, regrow, room, type })
    this.game = room.game
    this.created = this.game.frame
    this.options = options
    this.makeBody()
    this.game.bindEntity(this)
  }

  makeBody() {}
  draw() {}

  damage(event) {
    let amount = event.amount
    if (amount <= 0 || this.hp <= 0) {
      // already died in previous damage
      return
    }
    this.hp -= amount
    if (this.hp <= 0) {
      this.destroy()
    }
  }

  respawn = () => {
    this.game.foregroundEntity(this)
    this.hp = this.max_hp
    this.options.onRespawn?.()
  }

  destroy = () => {
    const { regrow } = this
    if (regrow) {
      if (this.type === 'crumble') {
        this.game.setTimeout(() => {
          this.game.backgroundEntity(this)
          this._death_timeout = this.game.setTimeout(this.respawn, regrow)
        }, 4)
      } else {
        this.game.backgroundEntity(this)
        this._death_timeout = this.game.setTimeout(this.respawn, regrow)
      }
    } else {
      if (this.type === 'crumble') {
        this.game.setTimeout(() => this.game.removeEntity(this), 4)
      } else {
        this.game.removeEntity(this)
      }
    }
    const { x, y, width, height } = this.options
    this.room.drawOnFg(null, { x, y, width, height })
    this.options.onDestroy?.()
  }

  onCollide(_entity, _result) {
    return // noop
  }

  tick() {}
}
