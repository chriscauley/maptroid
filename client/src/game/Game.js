import p2 from 'p2'

import useAssets from './useAssets'
import Player from './Player'
import { SCENERY_GROUP, BULLET_GROUP, PLAYER_GROUP, PLAYER_ACTIONS } from './constants'
import WorldController from './WorldController'

// Collision groups
const FIXED_DELTA_TIME = 1 / 60
const MAX_SUB_STEPS = 10

window.p2 = p2

const { vec2 } = p2

export default class Game extends p2.EventEmitter {
  constructor(canvas, options) {
    super()
    this.options = options
    this.canvas = canvas
    this.resize()

    this.init()
    useAssets().then(() => {
      requestAnimationFrame(this.animate)
    })
  }

  resize() {
    this.ctx = this.canvas.getContext('2d')
  }

  init() {
    // Init canvas
    Object.assign(this, {
      cameraPos: [0, 0],
      zoom: 25,
      entities: {},
      background_entities: [],
      TIMEOUT_ID: 1,
      _timeouts: [],
      // start mouse offscreen
      mouse: { canvas_xy: [-1e6, -1e6], world_xy: [-1e6, -1e6], _world_xy: [-1e6, -1e6] },
      frame: 0,
      ui: [], // random crap to draw on canvas
      actions: {}, // input map
      paused: true,
    })

    this.ctx.lineWidth = 1 / this.zoom

    // Init world
    this.p2_world = new p2.World()
    window._GAME = this
    this.p2_world.on('impact', (e) => {
      // non-player collisions
      e.bodyA._entity?.impact?.(e)
    })

    const { world, rooms, zones, room_id } = this.options
    this.world_controller = new WorldController({ world, rooms, zones, game: this })
    this.current_room = this.world_controller.room_by_id[room_id]
    this.current_room.bindGame(this)

    // Create the character controller
    this.player = new Player({ game: this, p2_world: this.p2_world, start: [0, 0] })
    this.current_room.positionPlayer(this.player)
    this.p2_world.on('postStep', () => {
      this.player.update(this.p2_world.lastTimeStep)
      const { aabb } = this.player.body
      this.current_room.edges.forEach((body) => {
        if (body.aabb.overlaps(aabb)) {
          // console.log(body.position.toString())
        }
      })
    })
    this.player?.on('collide', (_result) => {
      // console.log(_result)
    })
    // Set up key listeners
    PLAYER_ACTIONS.forEach((a) => {
      this.actions[a] = {
        keydown: () => this.player.press(a),
        keyup: () => this.player.release(a),
      }
    })

    // Update the character controller after each physics tick.
    this.p2_world.on('postStep', () => {
      const now = this.p2_world.time
      const do_now = this._timeouts.filter((t) => t.when <= now)
      this._timeouts = this._timeouts.filter((t) => t.when > now)
      do_now.forEach((t) => t.action())
    })

    this.p2_world.on('damage', (result) => {
      const { damage } = result
      this.entities[damage.body_id]?.damage?.(result.damage)
      // console.log(_result)
    })
    this.p2_world.step(FIXED_DELTA_TIME, FIXED_DELTA_TIME, MAX_SUB_STEPS)
  }

  click() {
    const [mouse_x, mouse_y] = this.mouse.world_xy.map((i) => Math.ceil(i))
    return {
      mouse_x,
      mouse_y,
      entity: {
        ...Object.values(this.entities).find((entity) => {
          const [x, y] = entity.body.position
          return x === mouse_x && y === mouse_y
        }),
      },
    }
  }

  mousemove(event) {
    const rect = event.target.getBoundingClientRect()
    const x = (event.clientX - rect.left) / this.zoom
    const y = (event.clientY - rect.top) / this.zoom
    this.mouse.canvas_xy = [x, -y] // y is reversed in physics relative to dom
  }

  setTimeout(action, delay) {
    const created = this.p2_world.time
    const when = created + delay
    const id = this.TIMEOUT_ID
    const timeout = { action, when, created, id }
    this._timeouts.push(timeout)
    this.TIMEOUT_ID++
    return timeout
  }

  clearTimeout(timeout) {
    this._timeouts = this._timeouts.filter((t) => t !== timeout)
  }

  close() {
    cancelAnimationFrame(this._frame)
  }

  addStaticCircle(x, y, radius, angle = 0) {
    var body = new p2.Body({ position: [x, y], angle: angle })
    body.addShape(new p2.Circle({ collisionGroup: SCENERY_GROUP, radius }))
    this.p2_world.addBody(body)
    return body
  }

  addStaticBox([x, y, width, height, angle = 0], options) {
    const collisionMask = PLAYER_GROUP | BULLET_GROUP
    const shape = new p2.Box({ collisionGroup: SCENERY_GROUP, collisionMask, width, height })
    Object.assign(shape, options)
    const body = new p2.Body({
      position: [x, y],
      angle: angle,
    })
    body.addShape(shape)
    this.p2_world.addBody(body)
    return body
  }

  addStaticShape(coords, options) {
    const body = new p2.Body({ position: [0, 0] })
    body.fromPolygon(coords.slice()) // NOTE p2 consumes coords so make a copy
    body.shapes.forEach((s) => Object.assign(s, options))
    this.p2_world.addBody(body)
    return body
  }

  drawBody(body) {
    this.ctx.lineWidth = 0
    this.ctx.strokeStyle = 'none'
    const [x, y] = body.interpolatedPosition
    const s = body.shapes[0]
    this.ctx.fillStyle = s._color || 'white'
    this.ctx.save()
    this.ctx.translate(x, y) // Translate to the center of the box
    this.ctx.rotate(body.interpolatedAngle) // Rotate to the box body frame

    if (body._entity?.draw) {
      body._entity.draw(this.ctx)
    } else if (s instanceof p2.Box) {
      this.ctx.fillRect(-s.width / 2, -s.height / 2, s.width, s.height)
    } else if (s instanceof p2.Circle) {
      this.ctx.beginPath()
      this.ctx.arc(0, 0, s.radius, 0, 2 * Math.PI)
      this.ctx.fill()
      this.ctx.closePath()
    } else {
      body.shapes.forEach((shape) => {
        this.ctx.fillStyle = shape._color || 'white'
        const [x0, y0] = shape.position
        this.ctx.beginPath()
        const [x, y] = shape.vertices[shape.vertices.length - 1]
        this.ctx.moveTo(x + x0, y + y0)
        shape.vertices.forEach((xy) => {
          this.ctx.lineTo(xy[0] + x0, xy[1] + y0)
        })
        this.ctx.fill()
        this.ctx.closePath()
      })
    }

    this.ctx.restore()
  }

  render() {
    const { width, height } = this.canvas
    this.ctx.fillStyle = 'black'
    this.ctx.fillRect(0, 0, width, height)

    // Transform the canvas
    // Note that we need to flip the y axis since Canvas pixel coordinates
    // goes from top to bottom, while physics does the opposite.
    this.ctx.save()
    this.ctx.translate(width / 2, height / 2) // Translate to the center
    this.ctx.scale(this.zoom, -this.zoom) // Zoom in and flip y axis

    if (this.player) {
      const { body } = this.player

      vec2.lerp(
        this.cameraPos,
        this.cameraPos,
        [-body.interpolatedPosition[0], -body.interpolatedPosition[1]],
        0.2,
      )
    }

    this.ctx.translate(this.cameraPos[0], this.cameraPos[1])

    // Draw all bodies
    this.background_entities.forEach((e) => this.drawBody(e.body))
    this.p2_world.bodies.forEach((body) => this.drawBody(body))

    if (this.mouse.canvas_xy) {
      const zoom = this.zoom
      const [mouse_x, mouse_y] = this.mouse.canvas_xy
      const x = mouse_x - (0.5 * width) / zoom - this.cameraPos[0]
      const y = mouse_y + (0.5 * height) / zoom - this.cameraPos[1]
      this.mouse._world_xy = [x, y]
      this.mouse.world_xy = [Math.floor(x), Math.floor(y)]
    }

    this.ui.forEach((item) => {
      this.ctx.fillStyle = 'white'
      this.ctx.strokeStyle = 'white'
      this.ctx.lineWidth = 0.1
      if (item.type === 'box') {
        this.ctx.strokeRect(item.xy[0], item.xy[1], 1, 1)
      } else if (item.type === 'dot') {
        const r = 0.1
        this.ctx.beginPath()
        this.ctx.arc(item.xy[0], item.xy[1], r, 0, 2 * Math.PI)
        this.ctx.fill()
      } else if (item.type === 'polyline') {
        if (item.xys.length) {
          this.ctx.setLineDash(item.lineDash || [])
          this.ctx.beginPath()
          this.ctx.moveTo(item.xys[0][0], item.xys[0][1])
          item.xys.forEach((xy) => this.ctx.lineTo(xy[0], xy[1]))
          this.ctx.stroke()
          this.ctx.setLineDash([])
        }
      }
    })

    // Restore transform
    this.ctx.restore()
  }

  // Animation loop
  animate = (time) => {
    cancelAnimationFrame(this._frame)
    this._frame = requestAnimationFrame(this.animate)

    this.tick(time) // move game froward in time
    this.render() // draw to canvas
    this.emit({ type: 'draw', ctx: this.ctx })
    this.lastTime = time
  }

  tick(time) {
    // Compute elapsed time since last frame
    let deltaTime = this.lastTime ? (time - this.lastTime) / 1000 : 0
    deltaTime = Math.min(1 / 10, deltaTime)

    // Move physics bodies forward in time
    !this.paused && this.p2_world.step(FIXED_DELTA_TIME, deltaTime, MAX_SUB_STEPS)
    this.frame++
  }

  stop() {
    cancelAnimationFrame(this._frame)
  }

  bindEntity(entity) {
    entity.id = entity.body.id
    entity.body._entity = entity
    this.entities[entity.id] = entity
    this.p2_world.addBody(entity.body)
  }

  removeEntity(entity) {
    delete this.entities[entity.id]
    this.p2_world.removeBody(entity.body)
  }

  backgroundEntity(entity) {
    // moves an entity to the background so it can still be renedered without being in the p2_world
    this.background_entities.push(entity)
    this.p2_world.removeBody(entity.body)
  }

  foregroundEntity(entity) {
    this.background_entities = this.background_entities.filter((e) => e.id !== entity.id)
    this.p2_world.addBody(entity.body)
  }
}
