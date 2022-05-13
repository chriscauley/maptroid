import ProjectileController from './ProjectileController'

export default class DustController extends ProjectileController {
  constructor(options) {
    options.items = ['first-dust', 'charged-dust']
    super(options)
    this.is_dust = true
  }
  canCharge() {
    return this.player.tech['super-missile']
  }
  getRefractoryFrames() {
    // missile can 3 times in 2 seconds
    return 40
    // super missiles fire 3 times in 4 seconds
    return 80
  }
}
