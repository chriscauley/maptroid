import { Ray, RaycastResult } from 'p2'

import BaseController from './BaseController'
import Bullet from './Bullet'
import { SCENERY_GROUP } from '../constants'

export default class ProjectileController extends BaseController {
  constructor(options) {
    super(options)
    this.ray = new Ray({ mode: Ray.CLOSEST, collisionMask: SCENERY_GROUP })
    this.raycastResult = new RaycastResult()
    this.player.game.p2_world.on('preSolve', this.tick)
    this.bullets = {}
  }
  shoot() {
    if (this.enabled['spazer-beam']) {
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
    Object.values(this.bullets).forEach((b) => b.tick())
  }
  release() {}
  canCharge() {
    return true // TODO
  }
}
