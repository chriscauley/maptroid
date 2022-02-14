<template>
  <div class="trainer">
    <div class="trainer-stats">
      {{ time / 1000 }}
    </div>
    <div v-for="column in columns" class="trainer-column" :key="column.slug">
      <div class="trainer-column__header">
        <div :class="column.header_icon" />
      </div>
      <div class="trainer-column__bars">
        <div class="trainer-column__bar" :style="bar_style">
          <template v-for="action, i in column.actions" :key="i">
            <div v-bind="action.attrs" />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { startCase, invert } from 'lodash'

const BUTTONS = [
   'up', 'down', 'left', 'right', 'a', 'b', 'x', 'y', 'l', 'r',
]

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

const ACTION_TO_BUTTON = invert(BUTTON_TO_ACTION);

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

const Trick = (action_list, { fps=60 }={}) => {
  const frame_offset = Math.min(...action_list.map(a => a[1]))
  let last_time = 0
  const actions = action_list.map(([verb, start_frame, end_frame]) => {
    const start = 1000 * (start_frame - frame_offset) / fps
    const end = 1000 * (end_frame - frame_offset) / fps
    last_time = Math.max(last_time, end)
    return { verb, start, end }
  })
  return { actions, last_time }
}

const stutter4tap = Trick([
  // ['shot', 0, 62],
  // ['aim-up', 0, 62],
  // ['left', 2, 6],
  // ['left', 12, 18],
  // ['left', 30, 34],
  ['right', 84, 90],
  ['right', 94, 172],
  ['dash', 108, 112],
  ['dash', 134, 140],
  ['dash', 156, 160],
  ['dash', 166, 210],
  ['down', 172, 180],
  // ['right', 178, 194],
  // ['left', 214, 252],
  // ['jump', 232, 254],
  // ['up', 256, 258],
  // ['left', 258, 266],
  // ['jump', 260, 264],
  // ['item-select', 386, 388],
  // ['item-select', 394, 400],
  // ['up', 394, 436],
  // ['shot', 422, 428],
])

const test_action = Trick([
  ['right', 0, 60],
  ['left', 60, 120],
  ['right', 120, 180],
  ['left', 180, 240],
])

export default {
  data() {
    return { pressed: {}, px_per_ms: 0.5, time: 0, trick: test_action, rate: 0.5 }
  },
  computed: {
    columns() {
      return BUTTONS.map(slug => ({
        header_icon: [`trainer-column__icon --${slug}`, { '-pressed': this.pressed[slug] }],
        name: startCase(slug),
        slug,
        actions: this.actions.filter(a => a.button === slug),
      }))
    },
    bar_style() {
      return { top: `-${this.time * this.px_per_ms}px` }
    },
    actions() {
      return this.trick.actions.map(({ verb, start, end }) => {
        const button = ACTION_TO_BUTTON[verb]
        const duration = end - start
        return {
          button,
          verb,
          duration,
          attrs: {
            class: `trainer-column__note --${verb}`,
            style: {
              top: `${this.px_per_ms * start}px`,
              height: `${this.px_per_ms * duration}px`,
            },
          },
        }
      })
    }
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
      if (button) {
        this.pressed[button] = true
        if (!this.time) {
          this.start()
        }
      }
    },
    keyup(event) {
      const button = KEY_TO_BUTTON[event.key]
      if (button) {
        delete this.pressed[button]
      }
    },
    start() {
      this.start_time = new Date().valueOf()
      this.tick()
    },
    stop() {
      window.cancelAnimationFrame(this._frame)
    },
    tick() {
      this.time = this.rate * (new Date().valueOf() - this.start_time)
      if (this.time > this.trick.last_time + 1000) {
        this.stop()
      } else {
        this._frame = requestAnimationFrame(this.tick)
      }
    },
  },
}
</script>