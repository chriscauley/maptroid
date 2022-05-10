// Block are destructable terrain
import BaseEntity from './BaseEntity'
import { getIcon, getAsset } from '../useAssets'

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

const ANIMATION_DURATION = 25
const ANIMATION_FRAMES = 4

export default class BlockEntity extends BaseEntity {
  constructor(options) {
    super(options)
    this._type = TYPES[options.type] || TYPES['default']
  }

  damage(event) {
    if (this._type.weak_to && !this._type.weak_to.includes(event.type)) {
      return
    }
    if (this.hp) {
      this._shrinkBlock()
      if (false || this.regrow) {
        this._growing = ANIMATION_DURATION
        this.game.setTimeout(
          () => this.game.animations.push(() => this._growBlock()),
          this.regrow - ANIMATION_FRAMES,
        )
      }
    }
    super.damage(event)
  }

  _growBlock() {
    this._drawAnimation(ANIMATION_DURATION - this._growing)
    this._growing--
    return this._growing > -1
  }

  _shrinkBlock() {
    let break_frames = ANIMATION_DURATION
    this.game.animations.push(() => {
      this._drawAnimation(break_frames)
      break_frames--
      return break_frames > -1
    })
  }

  _drawAnimation(count) {
    const index = Math.floor((ANIMATION_FRAMES * (ANIMATION_DURATION - count)) / ANIMATION_DURATION)
    const { img } = getAsset('breaking-block')
    const source_bounds = [0, index * 16, 16, 16]
    this.room.drawOnFg(img, this, source_bounds)
  }

  onCollide(entity, result) {
    this._type.onCollide?.(this, entity, result)
  }

  draw() {
    if (this._needs_draw) {
      this._needs_draw = false
      this.room.drawOnFg(getIcon('block', this.type), this)
    }
  }
}
