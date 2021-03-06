import { Ray, RaycastResult } from 'p2'

import BaseController from './BaseController'
import Bullet from './Bullet'
import { GROUP } from '../constants'

export default class ProjectileController extends BaseController {
  constructor(options) {
    super(options)
    this.ray = new Ray({ mode: Ray.CLOSEST, collisionMask: GROUP.scenery })
    this.raycastResult = new RaycastResult()
    this.player.game.p2_world.on('preSolve', this.tick)
    this.bullets = {}
  }

  shoot() {
    const frame = this.player.game.frame
    if (this.getCooldown() + this.last_fired > frame) {
      return
    }
    this.last_fired = frame

    if (this.is_dust) {
      this._shootBullet({ dust: 1 })
    } else if (this.enabled['spazer-beam']) {
      if (this.enabled['wave-beam']) {
        this._shootBullet()
        this._shootBullet({ wave: 1 })
        this._shootBullet({ wave: -1 })
      } else {
        this._shootBullet()
        this._shootBullet({ y_offset: 1 })
        this._shootBullet({ y_offset: -1 })
      }
    } else {
      if (this.enabled['wave-beam']) {
        this._shootBullet({ wave: 1 })
        if (this.enabled['plasma-beam']) {
          this._shootBullet({ wave: -1 })
        }
      } else {
        this._shootBullet()
      }
    }
  }

  _shootBullet(options = {}) {
    const bullet = new Bullet(this, options)
    this.bullets[bullet.id] = bullet
  }

  press() {
    this.shoot()
  }

  tick = () => {
    // TODO this should be handled by the game's entity list
    Object.values(this.bullets).forEach((b) => b.tick())
  }

  release() {
    if (this.is_charged) {
      this.shoot()
      this.is_charged = false
    }
  }

  canCharge() {
    return false // TODO
  }
}
