import { ReactiveLocalStorage } from '@unrest/vue-storage'

export default () =>
  ReactiveLocalStorage({
    LS_KEY: 'misc__local',
    initial: {
      sm_layer: 'layer-1',
      current_video_id: null,
    },
  })

export const bindLocal = (namespace, names) =>
  Object.fromEntries(
    names.map((name) => {
      const key = `${namespace}__${name}`
      return [
        name,
        {
          get() {
            return this.$store.local.state[key]
          },
          set(value) {
            this.$store.local.save({ [key]: value })
          },
        },
      ]
    }),
  )
