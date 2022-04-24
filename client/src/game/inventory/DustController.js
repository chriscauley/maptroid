import ProjectileController from './ProjectileController'

export default class DustController extends ProjectileController {
  constructor(options) {
    options.items = ['first-dust', 'charged-dust']
    super(options)
  }
}
