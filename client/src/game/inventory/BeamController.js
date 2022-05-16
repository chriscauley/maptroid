import ProjectileController from './ProjectileController'
import { COOLDOWN } from '../constants'

export default class BeamController extends ProjectileController {
  constructor(options) {
    options.items = ['charge-beam', 'ice-beam', 'wave-beam', 'spazer-beam', 'plasma-beam']
    super(options)
  }

  canCharge() {
    return this.enabled['charge-beam']
  }

  getCooldown() {
    return COOLDOWN.beam
  }
}
