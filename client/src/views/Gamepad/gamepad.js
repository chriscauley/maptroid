// import Controller from '@/vendor/controller.js/unminified/Controller.js'

// console.log(1)
// Controller.search();

// window.addEventListener('gc.controller.found', function(event) {
//     var controller = event.detail.controller;
//     console.log("Controller found at index " + controller.index + ".");
//     console.log("'" + controller.name + "' is ready!");
// }, false);

// window.addEventListener('gc.button.press', function(event) {
//   console.log(event.detail);
// }, false);

export const button_list = [
  'a', // 0
  'b', // 1
  'x', // 2
  'y', // 3
  'l', // 4
  'r', // 5
  'lt', // 6
  'rt', // 7
  'select', // 8
  'start', // 9
  'lclick', // 10
  'rclick', // 11
  'up', // 12
  'down', // 13
  'left', // 14
  'right', // 15
  'home', // 16
]

export const axis_list = [
  'left-x', // 0
  'left-y', // 1
  'right-x', // 2
  'right-y', // 3
]

const noop = () => {}

export default function(options) {
  const { buttonDown = noop, buttonUp = noop, setAxis = noop, callback = noop } = options
  const button_state = {}
  const axis_state = {}
  const update = () => {
    for (const gamepad of navigator.getGamepads()) {
      if (!gamepad) continue
      window.gamepad = gamepad
      gamepad.buttons.forEach((button, index) => {
        if (button.pressed && !button_state[index]) {
          button_state[index] = true
          buttonDown(button_list[index])
        } else if (!button.pressed && button_state[index]) {
          button_state[index] = false
          buttonUp(button_list[index])
        }
      })
      for (const [index, value] of gamepad.axes.entries()) {
        if (axis_state[index] !== value) {
          axis_state[index] = value
          setAxis(axis_list[index], value)
        }
      }
    }
    callback()
    requestAnimationFrame(update)
  }
  update()
}
