import ProjectileController from './ProjectileController'

export default class BeamController extends ProjectileController {
  constructor(options) {
    options.items = ['charge-beam', 'ice-beam', 'wave-beam', 'spazer-beam', 'plasma-beam']
    super(options)
  }
  release() {
    if (this.enabled['charge-beam'] && this.is_charged) {
      this.shoot()
      this.is_charged = false
    }
  }
}
