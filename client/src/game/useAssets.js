import SpriteSheet from '@/views/SpriteSheet/store'

const cache = {}
const loading = {}
const load = (key) => {
  if (cache.key) {
    return Promise.resolve()
  }
  if (loading[key]) {
    return new Promise((resolve) => loading[key].push(resolve))
  }
  loading[key] = []
  return new Promise((resolve) => {
    const img = document.createElement('img')
    img.onload = () => {
      const size = img.height
      cache[key] = { img, sw: size, sh: size }
      loading[key].forEach((f) => f())
      delete loading[key]
      resolve()
    }
    img.src = `/static/sm/${key}.png`
  })
}

export const getAsset = (key) => cache[key]

export default () =>
  Promise.all([
    SpriteSheet('power-suit').load(),
    SpriteSheet('weapons').load(),
    load('wave-beam-bullets'),
    load('ice-beam-bullets'),
    load('long-beam-bullets'),
  ])
