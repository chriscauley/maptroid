import { ReactiveLocalStorage } from '@unrest/vue-storage'

const LS_KEY = 'UNREST_CONTROLS'
const { state: config, save } = ReactiveLocalStorage({ LS_KEY })

let defaults = {}

const setDefaults = (new_defaults) => {
  Object.assign(defaults, new_defaults)
  save({ ...defaults, ...config })
}

const resetDefaults = () => save(defaults)

const reversed = {}
Object.entries(config).map(([key, value]) => (reversed[value] = key))

const set = (key, value) => {
  const swapt = reversed[value]
  if (swapt) {
    config[swapt] = config[key]
  }
  config[key] = value
  save()
  Object.entries(config).map(([key, value]) => (reversed[value] = key))
}

export default { config, defaults, setDefaults, reversed, resetDefaults, set }
