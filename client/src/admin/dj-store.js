// This is from my first attempt at making @unrest/vue-admin using a django server
// preserving here as I will eventually make this an option

import { ReactiveRestApi, RestStorage } from '@unrest/vue-storage'
import { startCase } from 'lodash'

const _model_stores = {}

const fromServer = (data) => {
  const { _registry } = store.state
  Object.values(data.apps).forEach((app) => {
    app.verbose = startCase(app.app_label)
    _registry.apps[app.app_label] = app
    _registry.models[app.app_label] = {}
    app.models.forEach((model) => {
      const { app_label, model_name } = model
      _registry.models[app_label][model_name] = model
      model.verbose = startCase(model.verbose || model_name)
      model.key = `${app_label}/${model_name}`
      _registry[model.key] = model
      if (!_model_stores[model.key]) {
        const slug = `admin/${model.key}`
        _model_stores[model.key] = RestStorage(slug, { collection_slug: slug })
      }
      const { getOne, getPage, save, delete: _delete } = _model_stores[model.key]
      const getApp = () => app
      Object.assign(model, { getApp, getOne, getPage, save, delete: _delete })
    })
  })
  return data
}

const store = ReactiveRestApi({ fromServer })

store.state._registry = {
  apps: {},
  models: {},
}

const getApps = () => store.get('/admin/')?.apps || {}

export default {
  getApps,
  listApps() {
    getApps()
    return Object.values(store.state._registry.apps)
  },
  getModel(app_label, model_name) {
    getApps()
    if (typeof app_label === 'object') {
      // passed in object to destructure instead of 2 args
      model_name = app_label.model_name
      app_label = app_label.app_label
    }
    return store.state._registry[`${app_label}/${model_name}`]
  },
}
