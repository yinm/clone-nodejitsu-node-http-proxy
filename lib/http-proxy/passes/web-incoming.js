const httpNative = require('http')
const httpsNative = require('https')
let web_o = require('./web-outgoing')
const common = require('../common')
const followRedirects = require('follow-redirects')

web_o = Object.keys(web_o).map(pass => web_o[pass])

const nativeAgents = {
  http: httpNative,
  https: httpsNative,
}

/**
 * Array of passes.
 *
 * A `pass` is just a function that is executed on. `req, res, options`
 * so that you can easily and new checks while still keeping the base
 * flexible.
 */
module.exports = {

  /**
   * Sets `content-length` to '0' if request is of DELETE type or OPTION type.
   *
   * @param {ClientRequest} req Request object
   * @param {IncomingMessage} res Response object
   * @param {Object} options Config object passed to the proxy
   */
  deleteLength(req, res, options) {
    if (
      (req.method === 'DELETE' || req.method === 'OPTIONS') &&
      !req.headers['content-length']
    ) {
      req.headers['content-length'] = '0'
      delete req.headers['transfer-encoding']
    }
  },

}
