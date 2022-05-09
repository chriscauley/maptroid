// Block are destructable terrain
import { minBy, range } from 'lodash'
import { getAsset } from '../useAssets'
import BaseEntity from './BaseEntity'
import p2 from 'p2'

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
  door: {
    color: 'blue',
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

export class DoorEntity extends BlockEntity {
  constructor(options) {
    super(options)
    const { color, orientation } = options
    Object.assign(this, { color, orientation })
    this.respawn_aabb = new p2.AABB()
    this.respawn_aabb.copy(this.body.aabb)
    if (orientation === 'left') {
      this.respawn_aabb.upperBound[0] -= 1
      this.respawn_aabb.lowerBound[0] -= 1
    } else if (orientation === 'right') {
      this.respawn_aabb.upperBound[0] += 1
      this.respawn_aabb.lowerBound[0] += 1
    } else if (orientation === 'up') {
      this.respawn_aabb.upperBound[0] += 8
      this.respawn_aabb.lowerBound[0] -= 8
      this.respawn_aabb.upperBound[1] += 2
      this.respawn_aabb.lowerBound[1] += 2
    } else if (orientation === 'down') {
      this.respawn_aabb.upperBound[0] += 8
      this.respawn_aabb.lowerBound[0] -= 8
      this.respawn_aabb.upperBound[1] -= 2
      this.respawn_aabb.lowerBound[1] -= 2
    }
  }

  damage(event) {
    if (true) { // TODO check damage type
      return
    }
    const edge = this.room.edges.find((e) => e.aabb.containsPoint(this.body.position))
    const target_room = this.game.world_controller.room_map[edge?._target_xy]
    if (target_room) {
      target_room.bindGame(this.game)
      const target_door = minBy(target_room.doors, (door) =>
        p2.vec2.squaredDistance(edge.position, door.body.position),
      )
      this.game.backgroundEntity(target_door)
      target_door.hidden_at = this.game.frame
      target_door.needs_close = this
    } else {
      console.warn('unable to find target room')
    }
    this.game.backgroundEntity(this)
    this.hidden_at = this.game.frame
  }

  draw(ctx) {
    let index = 0
    if (this.closing) {
      index = this.closing
      this.closing--
    } else if (this.hidden_at) {
      index = Math.floor((this.game.frame - this.hidden_at) / 4)
    }
    if (index < 4) {
      ctx.save()
      ctx.imageSmoothingEnabled = false
      const { width, height } = this.body.shapes[0]
      const { img, sw, sh } = getDoorSprite(this.color, this.orientation)
      ctx.drawImage(img, 0, index * sh, sw, sh, -width / 2, -height / 2, width, height)
      ctx.restore()
    }
  }

  closeDoors() {
    delete this.needs_close.close()
    delete this.needs_close
    this.close()
  }

  close() {
    this.game.foregroundEntity(this)
    delete this.hidden_at
    this.closing = 3
  }
}

const rotateCCW = (canvas) => {
  const canvas2 = document.createElement('canvas')
  canvas2.width = canvas.height
  canvas2.height = canvas.width
  const ctx = canvas2.getContext('2d')
  ctx.rotate(-Math.PI / 2)
  ctx.drawImage(canvas, -8, 0)
  return canvas2
}

const mirrorVertically = (canvas) => {
  const canvas2 = document.createElement('canvas')
  canvas2.width = canvas.width
  canvas2.height = canvas.height
  const ctx = canvas2.getContext('2d')
  ctx.translate(0, canvas.height)
  ctx.scale(1, -1)
  ctx.drawImage(canvas, 0, 0)
  return canvas2
}

const mirrorHorizontally = (canvas) => {
  const canvas2 = document.createElement('canvas')
  canvas2.width = canvas.width
  canvas2.height = canvas.height
  const ctx = canvas2.getContext('2d')
  ctx.translate(canvas.width, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(canvas, 0, 0)
  return canvas2
}

const _cache = {}
const getDoorSprite = (color, orientation) => {
  const key = `${color},${orientation}`
  if (!_cache[key]) {
    let canvas
    if (orientation === 'left') {
      const colors = ['red', 'orange', 'brown', 'green', 'blue']
      const { img } = getAsset('rainbow_opening')
      const sx = colors.indexOf(color) * 8
      canvas = document.createElement('canvas')
      canvas.width = 8
      canvas.height = 256
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, -sx, 0)
    } else if (orientation === 'right') {
      canvas = mirrorHorizontally(getDoorSprite(color, 'left').img)
    } else if (orientation === 'up') {
      canvas = mirrorVertically(getDoorSprite(color, 'down').img)
    } else if (orientation === 'down') {
      canvas = rotateCCW(getDoorSprite(color, 'left').img)
    }

    const sw = ['left', 'right'].includes(orientation) ? 8 : 64
    const sh = ['left', 'right'].includes(orientation) ? 64 : 8

    if (['up', 'down'].includes(orientation)) {
      const canvas2 = document.createElement('canvas')
      canvas2.width = 64
      canvas2.height = 32
      const ctx = canvas2.getContext('2d')
      range(4).forEach((i) => ctx.drawImage(canvas, -i * 64, i * 8))
      canvas = canvas2
    }
    document.body.appendChild(canvas)
    _cache[key] = { img: canvas, sw, sh }
  }
  return _cache[key]
}
