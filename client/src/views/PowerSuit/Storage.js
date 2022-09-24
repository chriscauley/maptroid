import { debounce, sortBy, memoize } from 'lodash'
import { getClient } from '@unrest/vue-storage'
import { reactive } from 'vue'

const client = getClient()

const Storage = () => {
  const sheetname = 'power-suit2'
  const state = reactive({
    loading: false,
  })

  const api_url = `sprite/spritesheet/${sheetname}/`
  const img_url = `/static/sm/${sheetname}.png`
  const waiting = []

  const _loadData = () => client.get(api_url).then((data) => (state.data = data))

  const _loadImage = () =>
    new Promise((resolve) => {
      const img = document.createElement('img')
      img.onload = () => {
        state.img = img
        resolve()
      }
      img.src = img_url
    })

  const load = () => {
    if (state.data && state.img) {
      return Promise.resolve()
    }
    if (state.loading) {
      return new Promise((resolve) => waiting.push(resolve))
    }
    state.loading = true
    return Promise.all([_loadData(), _loadImage()]).then(() => {
      while (waiting.length) {
        waiting.pop()()
      }
      state.loading = false
    })
  }

  const use = () => {
    if (!state.data && !state.loading) {
      load()
    }
    return state.data
  }

  const save = debounce(() => {
    state.data = Object.fromEntries(sortBy(Object.entries(state.data)))
    client.post(api_url, state.data)
  }, 1000)

  const addAnimation = (data) => {
    if (state.data[data.name]) {
      throw 'Name is already in use'
    }
    state.data[data.name] = data
    save()
  }

  const renameAnimation = (old_name, new_name) => {
    const a = state.data[old_name]
    delete state.data[old_name]
    state.data[new_name] = a
    a.name = new_name
    save()
  }

  return {
    save,
    state,
    use,
    addAnimation,
    renameAnimation,
    load,
  }
}

export default memoize(Storage)
