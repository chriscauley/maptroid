import { startCase } from 'lodash'

const registry = {
  apps: {},
  models: {},
}

const makeAdminOptions = (options = {}) => {
  const { list_display = ['id'], schema, getSchema = () => schema } = options
  return {
    getSchema,
    list_display: list_display.map((o) => {
      if (typeof o === 'function') {
        return { name: o.name, get: o }
      } else if (typeof o === 'string') {
        const name = o
        return { name, get: (item) => item[name] }
      }
      return o
    }),
  }
}

const register = ({ model_name, storage, app_label = 'main', verbose, admin_options }) => {
  if (!registry.apps[app_label]) {
    registry.apps[app_label] = {
      app_label,
      verbose: startCase(app_label),
      models: {},
    }
  }
  const app = registry.apps[app_label]
  const key = `${app_label}/${model_name}`
  verbose = verbose || startCase(model_name)
  admin_options = makeAdminOptions(admin_options)
  const model = { model_name, app_label, verbose, admin_options, key }
  registry[key] = model
  app.models[model_name] = model
  const { getOne, getPage, save, delete: _delete } = storage
  const getApp = () => app
  const getCount = () => getPage?.({ per_page: 1e9 })?.items.length
  Object.assign(model, { getOne, getPage, save, delete: _delete, getApp, getCount })
}

export default {
  register,
  getApps: () => registry.apps,
  listApps: () => Object.values(registry.apps),
  getApp: (app_label) => {
    return registry.apps[app_label]
  },
  getModel(app_label, model_name) {
    if (typeof app_label === 'object') {
      // passed in object to destructure instead of 2 args
      model_name = app_label.model_name
      app_label = app_label.app_label
    }
    return registry[`${app_label}/${model_name}`]
  },
}
