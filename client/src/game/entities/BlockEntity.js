// Block are destructable terrain
import BaseEntity from './BaseEntity'

const TYPES = {
  moss: {
    color: 'green',
    regrow: 30,
  },
  bomb: {
    color: 'rgb(255, 33, 33)',
    weak_to: ['bomb', 'speed', 'screw', 'beam'], // TODO remove beam
  },
  shot: {
    color: 'rgb(200, 200, 200)',
  },
  crumble: {
    weak_to: 'crumble',
    color: 'rgb(255, 200, 200)',
    onCollide(self, entity, result) {
      if (entity.is_player && result.dxy[1] === -1) {
        self.damage({ type: 'crumble', amount: 1 })
      }
    },
  },
  'power-bomb': {
    color: 'rgb(255, 255, 128)',
  },
  'super-missile': {
    color: 'rgb(128,255,128)',
  },
  grapple: {
    color: 'rgb(128, 255, 255)',
  },
  'grapple-break': {
    color: 'rgb(0, 128, 128)',
  },
  default: {
    color: 'rgb(255, 128, 128)',
  },
}

export default class BlockEntity extends BaseEntity {
  constructor(options) {
    super(options)
    this._type = TYPES[options.type] || TYPES['default']
  }

  damage(event) {
    if (this._type.weak_to && !this._type.weak_to.includes(event.type)) {
      return
    }
    super.damage(event)
  }

  onCollide(entity, result) {
    this._type.onCollide?.(this, entity, result)
  }
}
