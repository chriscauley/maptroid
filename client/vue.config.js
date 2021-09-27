const path = require('path')

const { VUE_APP_OFFLINE } = process.env

module.exports = {
  lintOnSave: false,
}

if (VUE_APP_OFFLINE) {
  module.exports.devServer = {
    host: 'maptroid.localhost',
    port: 8942,
    historyApiFallback: true,
  }
  module.exports.publicPath = '/maptroid/'
} else {
  module.exports.publicPath = '/static/'
}
