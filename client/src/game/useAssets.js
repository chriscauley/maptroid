import SpriteSheet from '@/views/SpriteSheet/store'
import icons from '@/../../server/static/sm/icons.json'

const cache = {
  __icons: {},
}
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
export const getIcon = (category, slug) => {
  const cache_key = `${category}__${slug}`
  if (!cache.__icons[cache_key]) {
    const [width, height] = icons[category].size
    const index = icons[category].icons.indexOf(slug)
    const { img } = getAsset(category)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, -index * height)
    cache.__icons[cache_key] = canvas
  }
  return cache.__icons[cache_key]
}

export default () =>
  Promise.all([
    SpriteSheet('power-suit').load(),
    SpriteSheet('weapons').load(),
    load('charge-beam'),
    load('wave-beam-bullets'),
    load('ice-beam-bullets'),
    load('long-beam-bullets'),
    load('rainbow_opening'),
    load('items'),
    load('block'),
    load('breaking-block'),
  ])
