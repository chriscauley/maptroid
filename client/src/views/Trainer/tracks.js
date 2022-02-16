const Track = (action_list, { fps = 60 } = {}) => {
  const frame_offset = Math.min(...action_list.map((a) => a[1]))
  let last_time = 0
  const actions = action_list.map(([verb, start_frame, end_frame]) => {
    const start = (1000 * (start_frame - frame_offset)) / fps
    const end = (1000 * (end_frame - frame_offset)) / fps
    last_time = Math.max(last_time, end)
    return { verb, start, end }
  })
  return { actions, last_time }
}

const stutter_4_tap = Track([
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

const march = Track([
  ['right', 0, 60],
  ['left', 60, 120],
  ['right', 120, 180],
  ['left', 180, 240],
])


export default { march, stutter_4_tap }