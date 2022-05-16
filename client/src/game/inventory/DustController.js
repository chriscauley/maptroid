import ProjectileController from './ProjectileController'
import { COOLDOWN } from '../constants'

export default class DustController extends ProjectileController {
  constructor(options) {
    options.items = ['first-dust', 'charged-dust']
    super(options)
    this.is_dust = true
  }
  canCharge() {
    return false
  }
  getCooldown() {
    const is_super = this.player.state.active_weapon === 'super-missile'
    return is_super ? COOLDOWN['super-missile'] : COOLDOWN.missile
  }
  shoot() {
    this.is_charged = this.player.state.active_weapon === 'super-missile'
    super.shoot()
  }
}
