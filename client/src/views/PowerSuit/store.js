import { debounce } from 'lodash'
import { getClient } from '@unrest/vue-storage'
import { reactive } from 'vue'

const client = getClient()
const state = reactive({
  loading: false,
})

const use = () => {
  if (!state.data && !state.loading) {
    client.get('/power-suit/').then((data) => (state.data = data))
    const img = document.createElement('img')
    img.onload = () => (state.img = img)
    img.src = '/static/sm/power-suit.png'
  }
  return state.data
}

const save = debounce(() => client.post('/power-suit/', state.data), 1000)

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

const getAnimation = (name) => {
  const sprite = state.data.animations[name]
  const frames = sprite.sprite_ids.map((sprite_id) => {
    const offset = sprite.offsets[sprite_id] || [0, 0]
    const canvas = document.createElement('canvas')
    const [sx, sy, sw, sh] = state.data.rects[sprite_id]
    canvas.width = sw
    canvas.height = sh
    const ctx = canvas.getContext('2d')
    ctx.drawImage(state.img, sx, sy, sw, sh, 0, 0, sw, sh)

    return {
      width: sw,
      height: sh,
      offset,
      sprite_id,
      canvas,
      src: canvas.toDataURL(),
    }
  })
  return {
    frames,
  }
}

export default {
  state,
  use,
  getAnimation,
  save,
  addAnimation,
}
