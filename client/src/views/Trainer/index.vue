<template>
  <div class="trainer">
    <div class="trainer-stats">
      {{ time / 1000 }}
    </div>
    <div class="trainer__now" />
    <div v-for="column in columns" class="trainer-column" :key="column.slug">
      <div class="trainer-column__header">
        <div :class="column.header_icon" />
      </div>
      <div class="trainer-column__bars">
        <div class="trainer-column__bar" :style="bar_style">
          <template v-for="(action, i) in column.actions" :key="i">
            <div v-bind="action.attrs" />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { startCase, invert } from 'lodash'
import tracks from './tracks'

const BUTTONS = ['up', 'down', 'left', 'right', 'a', 'b', 'x', 'y', 'l', 'r']

const BUTTON_TO_ACTION = {
  up: 'up',
  down: 'down',
  left: 'left',
  right: 'right',
  r: 'aim-up',
  l: 'aim-down',
  b: 'jump',
  x: 'item-select',
  a: 'dash',
  y: 'shot',
}

const ACTION_TO_BUTTON = invert(BUTTON_TO_ACTION)

const CONTROLLER = {
  up: 'up',
  down: 'down',
  left: 'left',
  right: 'right',
  a: 'a',
  b: 'b',
  x: 'x',
  y: 'y',
  l: 'l',
  r: 'r',
}

const BUTTON_TO_KEY = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',

  // TODO these defaults are terrible!
  a: 'z',
  b: 'x',
  x: 'a',
  y: 'r',
  r: 's',
  l: 'c',
}

const KEY_TO_BUTTON = invert(BUTTON_TO_KEY)

export default {
  data() {
    return {
      pressed: {},
      px_per_ms: 0.5,
      time: 0,
      track: tracks.stutter_4_tap,
      rate: 0.5,
      player_actions: [],
    }
  },
  computed: {
    columns() {
      return BUTTONS.map((slug) => ({
        header_icon: [`trainer-column__icon --${slug}`, { '-pressed': this.pressed[slug] }],
        name: startCase(slug),
        slug,
        actions: this.actions.filter((a) => a.button === slug),
      }))
    },
    bar_style() {
      return { top: `-${this.time * this.px_per_ms}px` }
    },
    actions() {
      const prep = (button, start, end, cls) => {
        const duration = (end || this.time) - start
        return {
          button,
          start,
          end,
          duration,
          attrs: {
            class: [`trainer-column__note --${button}`, cls],
            style: {
              top: `${this.px_per_ms * start}px`,
              height: `${this.px_per_ms * duration}px`,
            }
          }
        }
      }
      const actions = this.track.actions.map(({ verb, start, end }) => {
        const button = ACTION_TO_BUTTON[verb]
        const action = prep(button, start, end, '-track')
        return action
      })
      this.player_actions.forEach(({ button, start, end }) => prep(button, start, end, '-player'))
      return actions
    },
  },
  mounted() {
    document.addEventListener('keydown', this.keydown)
    document.addEventListener('keyup', this.keyup)
  },
  unmounted() {
    document.removeEventListener('keydown', this.keydown)
    document.removeEventListener('keyup', this.keyup)
    this.stop()
  },
  methods: {
    keydown(event) {
      const button = KEY_TO_BUTTON[event.key]
      if (button && !this.pressed[button]) {
        this.pressed[button] = {
          button,
          start: this.time,
        }
        this.player_actions.push(this.pressed[button])
        if (!this.time) {
          this.start()
        }
      }
    },
    keyup(event) {
      const button = KEY_TO_BUTTON[event.key]
      if (button && this.pressed[button]) {
        this.pressed[button].end = this.time
        delete this.pressed[button]
      }
    },
    start() {
      this.start_time = new Date().valueOf()
      this.time = 0
      this.last_time = this.time
      this.player_actions = []
      this.tick()
    },
    stop() {
      window.cancelAnimationFrame(this._frame)
      Object.values(this.pressed).forEach((action) => {
        action.end = this.time
      })
    },
    tick() {
      this.time = this.rate * (new Date().valueOf() - this.start_time)
      if (this.time > this.track.last_time + 1000) {
        this.stop()
      } else {
        this._frame = requestAnimationFrame(this.tick)
      }
    },
  },
}
</script>
