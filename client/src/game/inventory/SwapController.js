import BaseController from './BaseController'

export default class SwapController extends BaseController {
  press() {
    this.player.nextWeapon()
  }
  release() {}
  canCharge() {
    return false
  }
}
