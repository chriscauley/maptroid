import { BUTTON_LIST, AXIS_LIST } from './constants'
import store from './store'

const noop = () => {}
const button_state = {}
const axis_state = {}

const poll = (options) => {
  const { buttonDown = noop, buttonUp = noop, setAxis = noop, callback = noop } = options
  for (const gamepad of navigator.getGamepads()) {
    if (!gamepad) continue
    window.gamepad = gamepad
    gamepad.buttons.forEach((button, index) => {
      const key = BUTTON_LIST[index]
      if (button.pressed && !button_state[key]) {
        button_state[key] = true
        buttonDown(store.reversed[key] || key, key)
      } else if (!button.pressed && button_state[key]) {
        button_state[key] = false
        buttonUp(store.reversed[key] || key, key)
      }
    })
    for (const [index, value] of gamepad.axes.entries()) {
      if (axis_state[index] !== value) {
        axis_state[index] = value
        setAxis(AXIS_LIST[index], value)
      }
    }
  }
  callback()
}

export default {
  poll,
  watch: ({ throttle = 0, ...options }) => {
    let frame
    let last = new Date().valueOf()
    let update = () => {
      poll(options)
      frame = requestAnimationFrame(update)
    }
    if (throttle) {
      update = () => {
        if (!throttle || throttle < new Date().valueOf() - last) {
          poll(options)
          last = new Date().valueOf()
        }
        frame = requestAnimationFrame(update)
      }
    }

    update()
    return {
      button_state,
      axis_state,
      stop: () => cancelAnimationFrame(frame),
    }
  },
}
