import { ReactiveLocalStorage } from '@unrest/vue-storage'

export default () =>
  ReactiveLocalStorage({
    LS_KEY: 'misc__local',
    initial: {
      sm_layer: 'layer-1',
    },
  })
