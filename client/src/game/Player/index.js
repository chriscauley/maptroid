// Taken from p2.js/examples/canvas/js/KinematicCharacterController.js

import { reactive } from 'vue'
import { cloneDeep } from 'lodash'
import p2 from 'p2'

import Controller from './Controller'
import drawSprite from './drawSprite'
import { GROUP, POSTURE, ENERGY, SPEED } from '../constants'
import inventory from '../inventory'
import aim from './aim'
import animate from './animate'

window.p2 = p2

const { vec2 } = p2

// math helpers
function lerp(start, end, delta) {
  if (Math.abs(end - start) < delta) {
    return end
  }
  return start + delta * Math.sign(end - start)
}

export default class Player extends Controller {
  constructor(options = {}) {
    Object.assign(options, {
      collisionMask: GROUP.scenery | GROUP.item,
      velocityXSmoothing: 0.0001,
      legacy_controls: true,
    })
    options.body = new p2.Body({
      mass: 0,
      fixedRotation: true,
      damping: 0,
      type: p2.Body.KINEMATIC,
    })
    options.body.addShape(
      new p2.Box({
        width: 8 / 16,
        height: POSTURE._heights[POSTURE.stand], // TODO switch between ball and standing (=40/16)
        collisionGroup: GROUP.player,
      }),
    )
    options.p2_world.addBody(options.body)

    super(options)
    this.options = options
    this.game = options.game
    this.game.bindEntity(this)

    this.input = vec2.create()
    this.is_player = true
    this.cheat = true
    this.save_state = reactive({
      collected: {},
      disabled: {},
      missile: 0,
      'super-missile': 0,
      'power-bomb': 0,
      energy: ENERGY.base_energy,
      reserve: 0,
      ...options.save_state,
    })
    this.state = reactive(
      options.state || {
        posture: POSTURE.stand,
      },
    )
    this.aim = {
      position: vec2.create(),
      dxy: [0, 0],
    }
    this._charged = {}
    this.inventory = {
      bomb: new inventory.BombController({ player: this }),
      boots: new inventory.BootsController({ player: this }),
      beam: new inventory.BeamController({ player: this }),
      dust: new inventory.DustController({ player: this }),
      cycle: new inventory.CycleController({ player: this }),
      swap: new inventory.SwapController({ player: this }),
      'grappling-beam': new inventory.GrapplingBeamController({ player: this }),
      speedbooster: false, // TODO should this be a class
    }
    this.loadout = {
      shoot1: this.inventory.beam,
      shoot2: this.inventory.dust,
      bomb: this.inventory.bomb,
      boots: this.inventory.boots,
    }

    if (options.legacy_controls) {
      this.loadout.shoot1 = this.inventory.cycle
      this.loadout.shoot2 = this.inventory.swap
    }

    const {
      wallSlideSpeedMax = 3,
      wallStickTime = 0.25,
      wallJumpClimb = [20, 20], // holding towards wall
      wallLeap = [20, 20], // holding away from wall
      wallJumpOff = [20, 20], // holding neither
      minJumpHeight = 0.1,
      velocityXSmoothing = 0.2,
      velocityXMin = 0.5,
    } = cloneDeep(options)

    Object.assign(this, {
      wallSlideSpeedMax,
      wallStickTime,
      wallJumpClimb,
      wallJumpOff,
      wallLeap,
      minJumpHeight,
      velocityXSmoothing,
      velocityXMin,
    })

    this.setMaxJumpHeight(7.1, 1.533 / 2)

    this.tech = reactive({
      bomb_linked: true,
      bomb_triggered: true,
      'energy-tank': 0,
      'reserve-tank': 0,
      missile: 0,
      'super-missile': 0,
      'power-bomb': 0,
    })

    this.game.options.items.forEach((i) => {
      if (this.save_state.collected[i.id]) {
        this.collectItem({ id: i.id, type: i.data.type })
      }
    })

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
  }

  setMaxJumpHeight(maxJumpHeight, timeToJumpApex) {
    this.maxJumpHeight = maxJumpHeight
    this.timeToJumpApex = timeToJumpApex
    // yflip
    this._gravity = this.gravity = -(2 * maxJumpHeight) / Math.pow(timeToJumpApex, 2)
    this.maxJumpVelocity = Math.abs(this.gravity) * timeToJumpApex
    this.minJumpVelocity = Math.sqrt(2 * Math.abs(this.gravity) * this.minJumpHeight)
    this.terminalVelocity = -this.maxJumpVelocity
  }

  getMax(type) {
    const base = type === 'energy-tank' ? ENERGY.base_energy : 0
    return this.tech[type] * ENERGY.per_pack[type] + base
  }

  fullHeal() {
    this.save_state.energy = this.getMax('energy-tank')
  }

  heal(amount) {
    this.save_state.energy += amount
    const max_health = this.getMax('energy-tank')
    if (this.save_state.energy > max_health) {
      this.save_state.reserve += this.save_state.energy - max_health
      this.save_state.energy = max_health
      const max_reserve = this.getMax('reserve-tank')
      this.save_state.reserve = Math.max(this.save_state.reserve, max_reserve)
    }
  }

  addResource(type, amount) {
    if (type === 'energy') {
      this.heal(amount)
    } else {
      this.save_state[type] += amount
    }
  }

  doMacro() {
    // useful debug macros
    if (this.keys.right) {
      this.release('right')
      this.press('left')
    } else {
      this.release('left')
      this.press('right')
    }
  }

  press(key) {
    if (key === 'special') {
      this.doMacro()
    }
    this.keys[key] = 1
    if (this.game.paused) {
      if (key === 'pause') {
        this.game.togglePause()
        this.updatePointing()
      }
      return
    }

    // TODO there may be possible glitchiness with thes next line being after the pause logic
    this._last_pressed_at[key] = this.getNow()
    const { posture } = this.state
    if (posture === POSTURE.spin && ['shoot1', 'shoot2'].includes(key)) {
      this.setPosture(POSTURE.stand)
    }
    if (key === 'jump') {
      this._requestJump = true
    } else if (key === 'shoot1') {
      const slot = posture === POSTURE.ball ? 'bomb' : 'shoot1'
      this.loadout[slot]?.press()
    } else if (key === 'shoot2') {
      this.loadout.shoot2?.press()
    } else if (key === 'up') {
      if (this.checkVertical() || this.checkVertical(-2)) {
        if (posture === POSTURE.ball) {
          this.setPosture(POSTURE.crouch)
        } else if (posture === POSTURE.crouch) {
          this.setPosture(POSTURE.stand)
        }
      }
    } else if (key === 'down') {
      animate.pulseFeet(this.game, this.body, 'white')
      if (posture === POSTURE.stand) {
        if (this.velocity[1] === 0 && this._last_collision?.body._entity?.onCrouch) {
          this._last_collision?.body._entity?.onCrouch()
          return
        } else {
          this.setPosture(POSTURE.crouch)
          this.state.crouching = 6
        }
      } else if (posture === POSTURE.crouch) {
        this.state.balling = 11
        this.setPosture(POSTURE.ball)
      }
    } else if (key === 'pause') {
      this.game.togglePause()
    } else if (key === 'swap') {
      if (this.options.legacy_controls) {
        delete this.state.active_weapon
      } else {
        console.warn('TODO switch loadout')
      }
    }
    this.updatePointing()
  }

  nextWeapon() {
    const weapons = ['missile', 'super-missile', 'power-bomb', 'grappling-beam', 'x-ray']
    const index = weapons.indexOf(this.state.active_weapon) + 1
    this.state.active_weapon = weapons[index]

    if (index >= weapons.length) {
      delete this.state.active_weapon
    } else if (!this.tech[this.state.active_weapon]) {
      // tech hasn't been picked up yet, skip to next weapon
      this.nextWeapon()
    }
  }

  setPosture(posture) {
    if (posture === this.state.posture) {
      return
    }
    const height = POSTURE._heights[posture]
    const old_height = this.body.shapes[0].height

    if (this.collisions.below) {
      // add half height difference to keep player on ground
      this.body.position[1] += (height - old_height) / 2
    } else if (height > old_height && !this.checkVertical(-1)) {
      // add half height difference to stop player from clipping through floor
      this.body.position[1] += (height - old_height) / 2
    }

    this.state.posture = posture
    this.body.removeShape(this.body.shapes[0])
    this.body.addShape(
      new p2.Box({
        width: 8 / 16,
        height,
        collisionGroup: GROUP.player,
      }),
    )
  }

  release(key) {
    this.keys[key] = 0
    if (this.game.paused) {
      return
    }
    if (key === 'jump') {
      this._requestUnJump = true
    } else if (key === 'shoot1') {
      const slot = this.state.posture === POSTURE.ball ? 'bomb' : 'shoot1'
      this.loadout[slot]?.release()
    } else if (key === 'shoot2') {
      this.loadout.shoot2?.release()
    } else if (key === 'special') {
      this.doMacro()
    }
    if (!(key === 'down' && !this.collisions.below)) {
      this.updatePointing()
    }
  }

  updatePointing() {
    const { up, down, aimup, aimdown, right, left } = this.keys
    if (aimup && aimdown) {
      this.state.pointing = 'zenith'
    } else if (up) {
      this.state.pointing = right ^ left ? 'upward' : 'zenith'
    } else if (aimup) {
      this.state.pointing = 'upward'
    } else if (aimdown) {
      this.state.pointing = 'downward'
    } else if (down && !this.collisions.below) {
      this.state.pointing = 'down'
    } else {
      this.state.pointing = undefined
    }
  }

  isWallsliding() {
    if (this.state.posture !== POSTURE.spin) {
      return false
    }
    const { left, right, below, _collide_angle } = this.collisions
    // yflip
    return (left || right) && !below && this.velocity[1] < 0 && _collide_angle % 90 < 1
  }

  tick() {}

  update(deltaTime) {
    this.aim = aim(this)
    if (this.pointing === 'down' && this.collisions.below) {
      this.pointing = undefined
    }
    if (
      this.state.posture === POSTURE.crouch &&
      this.collisions.below &&
      !this.collisions.last_below
    ) {
      this.setPosture(POSTURE.stand)
    }

    if (!this.collisions.below && this.collisions.last_below && this.velocity[1] <= 0) {
      this.body.position[1] -= this.skinWidth
    }

    const { collisions, velocity, keys } = this
    const input = [(keys.right ? 1 : 0) - (keys.left ? 1 : 0), 0]
    if (this.state.crouching > 0) {
      this.input[0] = 0
      this.state.crouching--
    }
    if (this.state.balling > 0) {
      this.state.balling--
    }

    // yflip
    if (this.terminalVelocity && velocity[1] < this.terminalVelocity) {
      // deltaTime was spent falling faster than terminalVelocity
      this.body.position[1] += deltaTime * this.terminalVelocity - deltaTime * velocity[1]
      velocity[1] = this.terminalVelocity
      this.gravity = 0
    }
    this._lastY = this.body.position[1]
    this._lastX = this.body.position[0]

    if (velocity[1] > this.terminalVelocity) {
      // yflip
      this.gravity = this._gravity
    }

    const wallDirX = collisions.left ? -1 : 1
    const wallSliding = this.isWallsliding()

    if (wallSliding) {
      if (velocity[1] < -this.wallSlideSpeedMax) {
        // yflip
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
      const posture = this.state.posture

      if (posture === POSTURE.ball) {
        // TODO springball
      } else if (!this.checkVertical(0.25)) {
        // not enough vertical room to stand
      } else if (wallSliding) {
        // yflip
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
        animate.pulseFeet(this.game, this.body, 'red')
        velocity[1] = this.maxJumpVelocity
        if (this.state.speeding) {
          this.setPosture(POSTURE.spin)
          velocity[1] *= 1.55
        } else if (keys.right && !collisions.right) {
          this.setPosture(POSTURE.spin)
          velocity[1] *= 1.1
        } else if (keys.left && !collisions.left) {
          this.setPosture(POSTURE.spin)
          velocity[1] *= 1.1
        }
      } else if (posture !== POSTURE.spin) {
        this.setPosture(POSTURE.spin)
      }
    } else if (collisions.below || keys.up || keys.down) {
      if (this.state.posture === POSTURE.spin) {
        this.setPosture(this.checkVertical() ? POSTURE.stand : POSTURE.crouch)
      }
    }

    if (this._requestUnJump) {
      this._requestUnJump = false
      // yflip
      if (velocity[1] > this.minJumpVelocity) {
        velocity[1] = this.minJumpVelocity
      }
    }

    // check speed booster and set speeding
    const x_speed = Math.abs(velocity[0])
    if (this.keys.run && !this.state.speeding) {
      if (Math.abs(x_speed - SPEED.boost) < 0.1) {
        this.state.speeding = this.game.frame
        animate.pulseFeet(this.game, this.body, '#44ff44')
      }
    } else if (this.collisions.below && x_speed < SPEED.run) {
      delete this.state.speeding
    }

    // determine new x velocity
    this._updateVelocityX(input, velocity, deltaTime)

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
        const new_v = sign * Math.sqrt((blast_count + 0.2) * -2 * this.gravity) // yflip
        const old_v = velocity[i]
        if (Math.sign(old_v) !== Math.sign(new_v) || Math.abs(new_v) > Math.abs(old_v)) {
          velocity[i] = new_v
        }
      }
    })
    this._blast_velocity = [0, 0]

    // yflip
    velocity[1] += this.gravity * deltaTime
    vec2.scale(this.scaledVelocity, velocity, deltaTime)
    this.move(this.scaledVelocity, input)

    if (collisions.above || collisions.below) {
      velocity[1] = 0
    }
    if (collisions.left || collisions.right) {
      velocity[0] = 0
    }
    // this.beam_rays = getBeamRays(this)
  }

  _updateVelocityX(input, velocity, deltaTime) {
    if (this.collisions.turning) {
      this.collisions.turn_for--
      if (this.collisions.turn_for < 0) {
        this.collisions.faceDir = this.collisions.turning
        delete this.collisions.turning
        delete this.collisions.turn_for
        velocity[0] = 0
        return
      } else {
        // turn velocity/acceleration guessed for 2 pixels walking, 2 blocks at full boost
        const targetVelocityX = this.collisions.turning * 0.8
        const x_step = 320 * deltaTime
        velocity[0] = lerp(velocity[0], targetVelocityX, x_step)
        return
      }
    }

    // Turning logic (only applies to standing or crouching)
    if ([POSTURE.crouch, POSTURE.stand].includes(this.state.posture) && input[0]) {
      if (input[0] !== this.collisions.faceDir) {
        // trying to move in opposite direction of facing, must turn
        this.collisions.turning = input[0]
        this.collisions.turn_for = 8
      } else if (this.state.posture === POSTURE.crouch) {
        if (this.checkVertical() && !(this.state.crouching > 0)) {
          this.setPosture(POSTURE.stand)
        }
      }
    }

    let targetVelocityX = input[0] * this.getMoveSpeed() // TODO issue #1
    if (
      Math.sign(targetVelocityX) === Math.sign(velocity[0]) &&
      Math.abs(targetVelocityX) < Math.abs(velocity[0])
    ) {
      targetVelocityX = velocity[0]
    }
    if (this.state.posture === POSTURE.spin && targetVelocityX === 0) {
      targetVelocityX = velocity[0]
    }

    const x_step = this.getMoveAcceleration(input) * deltaTime
    velocity[0] = lerp(velocity[0], targetVelocityX, x_step)
    if (Math.abs(velocity[0]) < this.velocityXMin) {
      velocity[0] = 0
    }
  }

  getNow() {
    return this.game.getNow()
  }

  getMoveAcceleration(input) {
    if (!input[0]) {
      if (this.state.posture === POSTURE.crouch) {
        return 300
      }
      return 80 // at full speed, letting go should stop in ~8 blocks
    }
    if (this.keys.run) {
      return Math.abs(this.velocity[0]) < 13 ? 68.4 : 17.5
    }
    return 53.6
  }

  getMoveSpeed() {
    if (this.state.posture === POSTURE.crouch) {
      return 0
    }
    if (this.state.posture === POSTURE.ball || !this.collisions.below) {
      return SPEED.walk
    }
    if (this.keys.run) {
      if (Math.abs(this.velocity[0]) < SPEED.run * 0.9) {
        return SPEED.run
      }
      // TODO speedbooster in inventory
      const boost = this.inventory.boots.enabled['speed-booster']
      return boost ? SPEED.boost : SPEED.run
    }
    return SPEED.walk
  }

  draw = (ctx) => {
    drawSprite(this, ctx)
    const { width, height } = this.body.shapes[0]
    ctx.lineWidth = 2 / this.game.zoom
    ctx.strokeStyle = 'gray'
    ctx.strokeRect(-width / 2, -height / 2, width, height)
  }

  toggleItem(item) {
    this.save_state.disabled[item.slug] = !this.save_state.disabled[item.slug]
  }

  getSaveJson() {
    return cloneDeep(this.save_state)
  }

  onCollide() {} // noop

  collectItem({ id, type }) {
    const pack_items = ['missile', 'super-missile', 'power-bomb', 'energy-tank', 'reserve-tank']
    if (pack_items.includes(type)) {
      this.tech[type]++
    } else {
      this.tech[type] = true
    }
    if (!this.save_state.collected[id]) {
      this.save_state.collected[id] = true
      if (type === 'energy-tank') {
        this.fullHeal()
      } else if (ENERGY.per_pack[type]) {
        this.addResource(type, ENERGY.per_pack[type])
      }
    }
  }

  enterRoom(room) {
    this.current_room = room
    room.bindGame(this.game)
  }
}
