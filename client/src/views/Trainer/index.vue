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
import { startCase, invert, cloneDeep } from 'lodash'
import tracks from './tracks'

const BUTTONS = ['up', 'down', 'left', 'right', 'a', 'b', 'x', 'y', 'l', 'r']

const BUTTON_TO_VERB = {
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

const VERB_TO_BUTTON = invert(BUTTON_TO_VERB)

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
    window._TRACK = this
    return {
      pressed: {},
      px_per_ms: 0.5,
      time: 0,
      rate: 0.5,
      player_actions: [],
      grade: {},
    }
  },
  computed: {
    track() {
      const track = cloneDeep(tracks.stutter_4_tap)
      track.actions.forEach((action) => {
        action.duration = action.end - action.start
        action.button = VERB_TO_BUTTON[action.verb]
      })
      track.actions = track.actions.filter((a) => a.button === 'right')
      return track
    },
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
      const prep = ({ button, start, end, cls }) => {
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
            },
          },
        }
      }
      const actions = this.track.actions.map(({ verb, start, end }) => {
        const button = VERB_TO_BUTTON[verb]
        return prep({ button, start, end, cls: '-track' })
      })
      Object.values(this.grade).forEach(({ button, start, end, value }) => {
        actions.push(prep({ button, start, end, cls: `-grade -value-${value}` }))
      })
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
      this.grade = {}
      BUTTONS.forEach((button) => (this.grade[button] = []))
      this.tick()
    },
    stop() {
      window.cancelAnimationFrame(this._frame)
      Object.values(this.pressed).forEach((action) => {
        action.end = this.time
      })
    },
    markGrade(button, value) {
      const grade_track = this.grade[button]
      let grade_note = grade_track[grade_track.length - 1]
      if (grade_note?.value !== value || grade_note?.end !== this.last_time) {
        grade_note = { button, value, start: this.time }
        grade_track.push(grade_note)
      }
      grade_note.end = this.time
    },
    tick() {
      this.last_time = this.time
      this.time = this.rate * (new Date().valueOf() - this.start_time)
      const should_press = {}
      this.track.actions.forEach((action) => {
        if (action.start <= this.time && action.end >= this.time) {
          should_press[action.button] = true
        }
      })
      if (this.time) {
        BUTTONS.forEach((button) => {
          if (this.pressed[button]) {
            if (should_press[button]) {
              this.markGrade(button, 'score')
            } else {
              this.markGrade(button, 'error')
            }
          } else if (should_press[button]) {
            this.markGrade(button, 'miss')
          }
        })
      }
      if (this.time > this.track.last_time) {
        this.stop()
      } else {
        this._frame = requestAnimationFrame(this.tick)
      }
    },
  },
}
</script>
