import BaseController from './BaseController'

export default class MiscController extends BaseController {
  constructor(options) {
    ;(options.items = ['morph-ball', 'bomb', 'spring-ball', 'screw-attack']), super(options)
  }
}
