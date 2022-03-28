// Taken from p2.js/examples/canvas/js/KinematicCharacterController.js

import p2 from 'p2'
import { cloneDeep } from 'lodash'
import Controller from './Controller'
import { PLAYER_GROUP, SCENERY_GROUP, POSTURE } from '../constants'
import inventory from '../inventory'
import drawRay from '../drawRay'
import getBeamRays from './getBeamRays'
import PowerSuit from '@/views/PowerSuit/store'

window.p2 = p2

const { vec2 } = p2

// math helpers
function lerp(factor, start, end) {
  return start + (end - start) * factor
}

// animation helper
const getFrame = (time, count, duration) => {
  return parseInt((count * (time % duration)) / duration)
}

export default class Player extends Controller {
  constructor(options = {}) {
    const { start = [0, 0] } = options
    Object.assign(options, {
      collisionMask: SCENERY_GROUP,
      velocityXSmoothing: 0.0001,
      skinWidth: 0.1,
    })
    start[1] += 1
    options.body = new p2.Body({
      mass: 0,
      position: start,
      fixedRotation: true,
      damping: 0,
      type: p2.Body.KINEMATIC,
    })
    options.body.addShape(
      new p2.Box({
        width: 8 / 16,
        height: POSTURE._heights[POSTURE.stand], // TODO switch between ball and standing (=40/16)
        collisionGroup: PLAYER_GROUP,
      }),
    )
    options.p2_world.addBody(options.body)

    super(options)
    this.game = options.game
    this.game.bindEntity(this)

    this.input = vec2.create()
    this.state = {
      posture: POSTURE.stand,
      health: 0, // will be healed after this.tech is set
    }
    this.inventory = {
      bomb: new inventory.BombController({ player: this }),
      beam: new inventory.BeamController({ player: this }),
    }
    this.loadout = {
      shoot1: this.inventory.beam,
      bomb: this.inventory.bomb,
    }
    const {
      accelerationTimeAirborne = 0,
      accelerationTimeGrounded = 0.1,
      moveSpeed = 12,
      wallSlideSpeedMax = 3,
      wallStickTime = 0.25,
      wallJumpClimb = [20, 20], // holding towards wall
      wallLeap = [20, 20], // holding away from wall
      wallJumpOff = [20, 20], // holding neither
      timeToJumpApex = 0.4,
      tech = { bomb_linked: true, bomb_triggered: true, e_tanks: 0 },
      maxJumpHeight = 4.2,
      minJumpHeight = 1,
      velocityXSmoothing = 0.2,
      velocityXMin = 0.5,
    } = cloneDeep(options)

    Object.assign(this, {
      accelerationTimeAirborne,
      accelerationTimeGrounded,
      moveSpeed,
      wallSlideSpeedMax,
      wallStickTime,
      wallJumpClimb,
      wallJumpOff,
      wallLeap,
      timeToJumpApex,
      tech,
      maxJumpHeight,
      minJumpHeight,
      velocityXSmoothing,
      velocityXMin,
    })

    this._gravity = this.gravity = -(2 * maxJumpHeight) / Math.pow(timeToJumpApex, 2)
    this.maxJumpVelocity = Math.abs(this.gravity) * timeToJumpApex
    this.minJumpVelocity = Math.sqrt(2 * Math.abs(this.gravity) * minJumpHeight)
    this.terminalVelocity = -this.maxJumpVelocity

    this.velocity = vec2.create()
    this.scaledVelocity = vec2.create()

    this.timeToWallUnstick = 0
    this._requestJump = false
    this._requestUnJump = false
    this._blast_velocity = [0, 0]

    this.keys = {
      left: 0,
      right: 0,
      up: 0,
      down: 0,
      shoot: 0,
      shoot2: 0,
      jump: 0,
      run: 0,
      aimup: 0,
      aimdown: 0,
    }
    this._last_pressed_at = {}
    this.heal(Infinity)
  }

  heal(amount) {
    this.state.health += amount
    this.state.health = Math.min(this.state.health, 99 + 100 * this.tech.e_tanks)
  }

  press(key) {
    const { posture } = this.state
    this._last_pressed_at[key] = new Date().valueOf()
    this.keys[key] = 1
    if (key === 'jump') {
      this._requestJump = true
    } else if (key === 'shoot1') {
      const slot = posture === POSTURE.ball ? 'bomb' : 'shoot1'
      this.loadout[slot]?.press()
    } else if (key === 'shoot2') {
      this.loadout.shoot2?.press()
    } else if (key === 'up') {
      if (posture === POSTURE.ball) {
        this.setPosture(POSTURE.crouch)
      } else if (posture === POSTURE.crouch) {
        this.setPosture(POSTURE.stand)
      }
    } else if (key === 'down') {
      if (posture === POSTURE.stand) {
        this.setPosture(POSTURE.crouch)
      } else if (posture === POSTURE.crouch) {
        this.setPosture(POSTURE.ball)
      }
    }
    this.updatePointing()
  }

  setPosture(posture) {
    this.state.posture = posture
    const height = POSTURE._heights[posture]
    const old_height = this.body.shapes[0].height
    this.body.removeShape(this.body.shapes[0])
    this.body.addShape(
      new p2.Box({
        width: 8 / 16,
        height,
        collisionGroup: PLAYER_GROUP,
      }),
    )
    if (height > old_height) {
      this.body.position[1] += height - old_height
    }
  }

  release(key) {
    this.keys[key] = 0
    if (key === 'jump') {
      this._requestUnJump = true
    } else if (key === 'shoot1') {
      const slot = this.state.posture === POSTURE.ball ? 'bomb' : 'shoot1'
      this.loadout[slot]?.release()
    } else if (key === 'shoot2') {
      this.loadout.shoot2?.release()
    }
    this.updatePointing()
  }

  updatePointing() {
    const { up, down, aimup, aimdown, right, left } = this.keys
    if (aimup && aimdown) {
      this.state.pointing = 'zenith'
    } else if (aimup) {
      this.state.pointing = 'upward'
    } else if (aimdown) {
      this.state.pointing = 'downward'
    } else if (up) {
      this.state.pointing = right ^ left ? 'upward' : 'zenith'
    } else if (down) {
      this.state.pointing = 'down'
    } else {
      this.state.pointing = undefined
    }
  }

  isWallsliding() {
    if (this.state.posture !== POSTURE.stand) {
      return false
    }
    const { collisions, velocity } = this
    return (collisions.left || collisions.right) && !collisions.below && velocity[1] < 0
  }

  update(deltaTime) {
    const { collisions, velocity, keys } = this
    const input = [(keys.right ? 1 : 0) - (keys.left ? 1 : 0), 0]
    if (this.terminalVelocity && velocity[1] < this.terminalVelocity) {
      // deltaTime was spent falling faster than terminalVelocity
      this.body.position[1] += deltaTime * this.terminalVelocity - deltaTime * velocity[1]
      velocity[1] = this.terminalVelocity
      this.gravity = 0
    }
    this._lastY = this.body.position[1]

    if (velocity[1] > this.terminalVelocity) {
      this.gravity = this._gravity
    }

    const wallDirX = collisions.left ? -1 : 1
    const targetVelocityX = input[0] * this.moveSpeed // TODO issue #1

    let smoothing = this.velocityXSmoothing
    smoothing *= collisions.below ? this.accelerationTimeGrounded : this.accelerationTimeAirborne
    const factor = 1 - Math.pow(smoothing, deltaTime)
    velocity[0] = lerp(factor, velocity[0], targetVelocityX)
    if (Math.abs(velocity[0]) < this.velocityXMin) {
      velocity[0] = 0
    }

    const wallSliding = this.isWallsliding()

    if (wallSliding) {
      if (velocity[1] < -this.wallSlideSpeedMax) {
        velocity[1] = -this.wallSlideSpeedMax
      }

      if (this.timeToWallUnstick > 0) {
        velocity[0] = 0

        if (input[0] !== wallDirX && input[0] !== 0) {
          this.timeToWallUnstick -= deltaTime
        } else {
          this.timeToWallUnstick = this.wallStickTime
        }
      } else {
        this.timeToWallUnstick = this.wallStickTime
      }
    }

    if (this._requestJump) {
      this._requestJump = false

      if (wallSliding) {
        if (wallDirX === input[0]) {
          velocity[0] = -wallDirX * this.wallJumpClimb[0]
          velocity[1] = this.wallJumpClimb[1]
        } else if (input[0] === 0) {
          velocity[0] = -wallDirX * this.wallJumpOff[0]
          velocity[1] = this.wallJumpOff[1]
        } else {
          velocity[0] = -wallDirX * this.wallLeap[0]
          velocity[1] = this.wallLeap[1]
        }
      } else if (collisions.below) {
        // can only jump if standing on something
        velocity[1] = this.maxJumpVelocity
      }
    }

    if (this._requestUnJump) {
      this._requestUnJump = false
      if (velocity[1] > this.minJumpVelocity) {
        velocity[1] = this.minJumpVelocity
      }
    }

    this._blast_velocity.forEach((blast_count, i) => {
      if (blast_count) {
        this._last_blast = this.p2_world.time
        const sign = Math.sign(blast_count)
        blast_count = Math.min(Math.abs(blast_count), 2) // cannot be moved up more than 2 squares
        if (i === 0) {
          // TODO issue #1
          // because it's trying to match the arrows for motion, x blasts get super damped out
          blast_count *= 2
        }
        const new_v = sign * Math.sqrt((blast_count + 0.2) * -2 * this.gravity)
        const old_v = velocity[i]
        if (Math.sign(old_v) !== Math.sign(new_v) || Math.abs(new_v) > Math.abs(old_v)) {
          velocity[i] = new_v
        }
      }
    })
    this._blast_velocity = [0, 0]

    velocity[1] += this.gravity * deltaTime
    vec2.scale(this.scaledVelocity, velocity, deltaTime)
    this.move(this.scaledVelocity, input)

    if (collisions.above || collisions.below) {
      velocity[1] = 0
    }
    this.beam_rays = getBeamRays(this)
  }

  _getSprite() {
    const { pointing } = this.state
    const breath_time = 16700 / 20
    const [dx, _dy] = this.scaledVelocity
    const dir = this.collisions.faceDir === -1 ? 'left' : 'right'
    if (this.state.posture === POSTURE.ball) {
      return ['ball_' + dir, getFrame(new Date().valueOf(), 8, 24000 / 30)]
    } else if (this.state.posture === POSTURE.crouch) {
      if (pointing === 'zenith') {
        return ['_poses_' + dir, 4]
      } else if (pointing === 'upward') {
        return ['_poses_' + dir, 5]
      } else if (pointing === 'downward') {
        return ['_poses_' + dir, 6]
      }
      const frame = getFrame(new Date().valueOf(), 3, breath_time)
      return ['crouch_' + dir, frame]
    }
    if (this.collisions.below) {
      // on ground
      if (Math.abs(dx) < 0.1) {
        if (pointing === 'zenith') {
          return ['_poses_' + dir, 1]
        } else if (pointing === 'upward') {
          return ['_poses_' + dir, 2]
        } else if (pointing === 'downward') {
          return ['_poses_' + dir, 3]
        } else if (pointing === 'down') {
          // TODO need to be able to shoot down from stainging
        }
        const frame = getFrame(new Date().valueOf(), 3, breath_time)
        return ['stand' + '_' + dir, frame]
      } else {
        let aim = ''
        if (pointing === 'zenith') {
          // TODO this is just not allowed in vanilla so I need to make a sprite for it
        } else if (pointing === 'upward') {
          aim = '_aimup'
        } else if (pointing === 'downward') {
          aim = '_aimdown'
        } else if (this.keys['shoot1'] || this.keys['shoot2']) {
          aim = '_aim'
        } else if (pointing === 'down') {
          // TODO Vanilla only has shoot down while jumping
        }

        const cycle_time = 500
        const frame = getFrame(new Date().valueOf(), 10, cycle_time)
        return ['walk' + aim + '_' + dir, frame]
      }
    }
    return ['crouch_left', 0]
  }

  drawSprite(ctx) {
    const _ise = ctx.imageSmoothingEnabled
    ctx.imageSmoothingEnabled = false
    const { _width, height } = this.body.shapes[0]
    const [name, frame] = this._getSprite()
    const { img, sx, sy, sw, sh, offset_x } = PowerSuit.getAnimationParams(name, frame, true)
    const dw = sw / 16
    const dh = sh / 16
    const base_y = -height / 2
    const base_x = -offset_x / 16
    ctx.drawImage(img, sx, sy, sw, sh, base_x, base_y, dw, dh)

    ctx.imageSmoothingEnabled = _ise
  }

  draw = (ctx) => {
    this.drawSprite(ctx)
    const [x, y] = this.body.position
    const { width, height } = this.body.shapes[0]
    ctx.lineWidth = 2 / this.game.zoom
    ctx.strokeStyle = 'gray'
    ctx.strokeRect(-width / 2, -height / 2, width, height)

    ctx.strokeStyle = 'red'
    ctx.lineWidth = 1 / this.game.zoom
    this.beam_rays.forEach((beam) => drawRay(ctx, beam))

    ctx.save()
    ctx.translate(-x, -y)
    ctx.strokeStyle = 'red'
    ctx.lineWidth = 1 / this.game.zoom
    this.last_rays.forEach((debug) => drawRay(ctx, debug))

    // this.loadout.shoot1.draw(ctx)
    ctx.restore()
  }
}
