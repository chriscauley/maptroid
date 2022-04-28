import p2 from 'p2'
import { SCENERY_GROUP, BULLET_GROUP, DIRECTIONS } from '../constants'

const { Ray, RaycastResult, vec2 } = p2
const BLAST_RADIUS = 0.75
const RADIUS = 0.1

class Bomb {
  constructor({ player }) {
    this.player = player
    this.type = 'bomb'
    this.makeShape()
    const [x, y] = this.player.body.position
    this.xy = [Math.floor(x), Math.floor(y)]
    this.created = this.player.p2_world.time
    this.detonate_at = this.player.p2_world.time + 1
  }

  detonate() {
    const { position } = this.body
    const ray = new Ray({
      mode: Ray.ALL,
      from: position,
      callback: (result) => {
        result.body &&
          this.player.p2_world.emit({
            damage: {
              type: 'bomb',
              player_id: this.player.id,
              amount: 1,
              body_id: result.body.id,
            },
            type: 'damage',
          })
      },
    })
    const result = new RaycastResult()
    ray.collisionMask = SCENERY_GROUP
    DIRECTIONS.forEach((dxy) => {
      result.reset()
      ray.to = [ray.from[0] + dxy[0] * BLAST_RADIUS, ray.from[1] + dxy[1] * BLAST_RADIUS]
      ray.update()
      this.player.p2_world.raycast(result, ray)
    })
    this.blastPlayer(this.player) // should this target other players?
    this.player.game.removeEntity(this)
    this.detonated = true
  }

  blastPlayer(player) {
    // Add +/- charges to the users "blast_velocity"
    // Any pixel to the left or right sends the user in that direction
    const distance = vec2.distance(player.body.position, this.body.position)
    if (distance > BLAST_RADIUS) {
      return
    }
    const dxy = vec2.subtract([0, 0], player.body.position, this.body.position)
    dxy[1] += 0.5 // bias vertical blasting to blast upwards
    const blast_velocity = dxy.map((i) => (Math.abs(i) < BLAST_RADIUS ? Math.sign(i) : 0))
    vec2.add(player._blast_velocity, player._blast_velocity, blast_velocity)

    // This stops player from being snapped to ground
    player.collisions.below = false
  }

  makeShape() {
    const position = vec2.copy([0, 0], this.player.body.position)
    this.body = new p2.Body({
      position,
      gravityScale: 0,
      collisionGroup: BULLET_GROUP,
    })
    this.body.addShape(new p2.Circle({ radius: RADIUS, collisionGroup: BULLET_GROUP }))
    this.player.game.bindEntity(this)
  }

  draw(ctx) {
    const dt = this.detonate_at - this.player.p2_world.time
    let colors = ['white', 'red']
    if (dt > 1) {
      colors = ['gray', 'white']
    }
    if (dt < 0.2 && dt > 0.1) {
      colors = ['red', 'white']
    }
    ;[ctx.fillStyle, ctx.strokeStyle] = colors
    ctx.lineWidth = 2 / this.player.game.zoom
    ctx.beginPath()
    ctx.arc(0, 0, RADIUS, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.fill()
    ctx.closePath()
  }
}

export default class BombController {
  constructor({ player }) {
    Object.assign(this, { player })
    this.bombs = []
    this.player.p2_world.on('preSolve', this.tick)
  }
  tick = () => {
    this.bombs.forEach((bomb) => {
      const dt = bomb.detonate_at - this.player.p2_world.time
      if (dt < 0.3) {
        bomb.flash = dt > 0.15
      }
      if (dt <= 0) {
        bomb.detonate()
      }
    })
    this.bombs = this.bombs.filter((bomb) => !bomb.detonated)
  }
  press() {
    const { player } = this
    const bomb = new Bomb({ player })
    const target_bomb = this.bombs.find(
      (b) => vec2.distance(b.body.position, bomb.body.position) < BLAST_RADIUS,
    )

    if (target_bomb) {
      // pauli exclusion principle
      bomb.detonate()
      target_bomb.detonate()
      this.bombs = this.bombs.filter((bomb) => !bomb.detonated)
      return
    }

    this.bombs.push(bomb)
    if (this.player.tech.bomb_triggered) {
      bomb.detonate_at += Infinity
    }
    if (this.player.tech.bomb_linked) {
      this.bombs.forEach((b) => (b.detonate_at = bomb.detonate_at))
    }
  }
  release() {
    const last_bomb = this.bombs[this.bombs.length - 1]
    if (last_bomb) {
      if (this.player.tech.bomb_triggered) {
        last_bomb.detonate_at = this.player.p2_world.time + 1
      }
      if (this.player.tech.bomb_linked) {
        this.bombs.forEach((b) => (b.detonate_at = last_bomb.detonate_at))
      }
    }
  }
}
