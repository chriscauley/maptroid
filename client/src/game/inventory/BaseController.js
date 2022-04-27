import { startCase } from 'lodash'

export default class BaseController {
  constructor({ player, items = [] }) {
    this.player = player
    this.items = items
    this.update()
  }
  update = () => {
    this.enabled = {}
    this.item_list = this.items.map((slug) => {
      this.enabled[slug] = !this.player.state.disabled[slug]
      return {
        slug,
        name: startCase(slug.replace),
        short_name: startCase(slug).replace(/ Beam$/, ''),
        collected: this.player.cheat || this.player.state.collected[slug],
        enabled: this.enabled[slug],
      }
    })
  }
  getItemList() {
    this.update() // needed to trigger watcher in PauseMenu component
    return this.item_list
  }
}
