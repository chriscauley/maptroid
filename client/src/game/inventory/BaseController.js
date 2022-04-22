import { startCase } from 'lodash'

export default class BaseController {
  constructor({ player, items = [] }) {
    this.player = player
    this.items = items
  }
  getItemList() {
    return this.items.map((slug) => ({
      slug,
      name: startCase(slug.replace),
      short_name: startCase(slug).replace(/ Beam$/, ''),
      collected: this.player.cheat || this.player.state.collected[slug],
      enabled: !this.player.state.disabled[slug],
    }))
  }
}
