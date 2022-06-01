import BaseController from './BaseController'

export default class SuitController extends BaseController {
  constructor(options) {
    ;(options.items = ['varia-suit', 'gravity-suit']), super(options)
  }
}
