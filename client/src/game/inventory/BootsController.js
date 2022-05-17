import BaseController from './BaseController'

export default class BootsController extends BaseController {
  constructor(options) {
    options.items = ['speed-booster', 'hi-jump-boots', 'space-jump']
    super(options)
  }
}
