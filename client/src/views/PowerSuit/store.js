import { debounce, sortBy } from 'lodash'
import { getClient } from '@unrest/vue-storage'
import { reactive } from 'vue'

const client = getClient()
const state = reactive({
  loading: false,
})

const waiting = []

const _loadData = () =>
  client.get('/power-suit/').then((data) => {
    state.data = data
    Object.values(data.animations).forEach((animation) => {
      animation.offsets = animation.offsets || {}
    })
  })

const _loadImage = () =>
  new Promise((resolve) => {
    const img = document.createElement('img')
    img.onload = () => {
      state.img = img
      resolve()
    }
    img.src = '/static/sm/power-suit.png'
  })

const _flipImage = () => {
  const { data, img } = state
  const canvas = (state.flipped = document.createElement('canvas'))
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  ctx.scale(1, -1)
  ctx.translate(0, -canvas.height)
  Object.values(data.animations).forEach((animation) => {
    animation.sprite_ids.forEach((_sprite_id, index) => {
      const { sx, sy, sw, sh } = getAnimationParams(animation.name, index)
      ctx.drawImage(img, sx, sy, sw, sh, sx, img.height - sy - sh, sw, sh)
    })
  })
}

const load = () => {
  if (state.data && state.image) {
    return Promise.resolve()
  }
  if (state.loading) {
    return new Promise((resolve) => waiting.push(resolve))
  }
  state.loading = true
  return Promise.all([_loadData(), _loadImage()])
    .then(() => {
      while (waiting.length) {
        waiting.pop()()
      }
      state.loading = false
    })
    .then(_flipImage)
}

const use = () => {
  if (!state.data && !state.loading) {
    load()
  }
  return state.data
}

const save = debounce(() => {
  state.data.animations = Object.fromEntries(sortBy(Object.entries(state.data.animations)))
  client.post('/power-suit/', state.data)
}, 1000)

const addAnimation = ({ name }) => {
  if (state.data.animations[name]) {
    throw 'Name is already in use'
  }
  state.data.animations[name] = {
    name,
    sprite_ids: [],
    offsets: {},
  }
  save()
}

const getAnimationParams = (name, index, flip) => {
  const animation = state.data.animations[name]
  if (!animation) {
    throw `Unable to find animation for ${name}`
  }
  const sprite_id = animation.sprite_ids[index]
  const [sx, sy, sw, sh] = state.data.rects[sprite_id]
  return { img: flip ? state.flipped : state.img, sx, sy, sw, sh }
}

const getAnimation = (name) => {
  const sprite = state.data.animations[name]
  const frames = sprite.sprite_ids.map((sprite_id) => {
    let offset = sprite.offsets[sprite_id] || [0, 0]
    const [_sx, _sy, width, height] = state.data.rects[sprite_id]
    if (sprite.preset === 'global') {
      offset = sprite.offsets[sprite.sprite_ids[0]] || [0, 0]
    } else if (sprite.preset === 'center') {
      offset = [parseInt(width / 2 - 5), parseInt(height / 2 - 5)]
    }
    return {
      width,
      height,
      offset,
      sprite_id,
    }
  })
  const left_x = Math.max(...frames.map((f) => f.offset[0]))
  const right_x = Math.max(...frames.map((f) => f.width - f.offset[0]))
  const top_y = Math.max(...frames.map((f) => f.offset[1]))
  const bottom_y = Math.max(...frames.map((f) => f.height - f.offset[1]))
  const width = left_x + right_x
  const height = top_y + bottom_y
  const canvas = document.createElement('canvas')
  canvas.width = width * frames.length
  canvas.height = height
  const ctx = canvas.getContext('2d')
  frames.forEach((f, i) => {
    const [sx, sy, sw, sh] = state.data.rects[f.sprite_id]
    ctx.drawImage(
      state.img,
      sx,
      sy,
      sw,
      sh,
      i * width + left_x - f.offset[0],
      0 + top_y - f.offset[1],
      sw,
      sh,
    )
  })
  return {
    src: canvas.toDataURL(),
    canvas,
    width,
    height,
    frames,
  }
}

const renameAnimation = (old_name, new_name) => {
  const a = state.data.animations[old_name]
  delete state.data.animations[old_name]
  state.data.animations[new_name] = a
  a.name = new_name
  save()
}

export default {
  state,
  use,
  save,
  addAnimation,
  getAnimation,
  renameAnimation,
  getAnimationParams,
  load,
}