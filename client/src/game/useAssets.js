import SpriteSheet from '@/views/SpriteSheet/store'
import icons from '@/../../server/static/sm/icons.json'

icons['items-alt'] = icons['items']

const cache = {
  __icons: {},
  __inverted: {},
}
const loading = {}
const load = (path, key) => {
  key = key || path
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
    img.src = `/static/sm/${path}.png`
  })
}

export const getAsset = (key) => cache[key]
export const invertAsset = (key) => {
  if (!cache.__inverted[key]) {
    const asset = getAsset(key).img
    const canvas = document.createElement('canvas')
    canvas.width = asset.width
    canvas.height = asset.height
    const ctx = canvas.getContext('2d')
    ctx.translate(0, canvas.height)
    ctx.scale(1, -1)
    ctx.drawImage(asset, 0, 0)
    cache.__inverted[key] = canvas
  }
  return cache.__inverted[key]
}

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
    load('items-alt'),
    load('block'),
    load('breaking-block'),
    load('animations/egg'),
    load('icons/templates/elevator-platform', 'platform'),
    load('icons/templates/ship', 'ship'),
  ])
