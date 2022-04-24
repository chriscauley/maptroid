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
    const bullet = new Bullet(this)
    this.bullets[bullet.id] = bullet
  }
  press() {
    this.shoot()
  }
  tick = () => {
    Object.values(this.bullets).forEach((b) => b.tick())
  }
  release() {}
}
