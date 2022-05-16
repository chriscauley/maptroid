import BaseController from './BaseController'

export default class CycleGunController extends BaseController {
  _getCurrentController() {
    const { active_weapon } = this.player.state
    if (active_weapon === 'missile' || active_weapon === 'super-missile') {
      return this.player.inventory.dust
    } else if (active_weapon === 'grappling-beam') {
      return this.player.inventory['grappling-beam']
    }
    // power-bomb is handled by checking posture in Player.press()
    // x-ray will be handled in Player.press() for run events
    return this.player.inventory.beam
  }
  press() {
    return this._getCurrentController().press()
  }
  release() {
    return this._getCurrentController().release()
  }
  tick() {
    return this._getCurrentController.tick()
  }
  canCharge() {
    return this._getCurrentController().canCharge()
  }
}
