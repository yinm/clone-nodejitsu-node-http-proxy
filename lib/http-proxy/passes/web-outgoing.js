const url = require('url')
const common = require('../common')

const redirectRegex = /^201|30(1|2|7|8)$/

/**
 * Array of passes.
 *
 * A `pass` is just a function that is executed on `req, res, options`
 * so that you can easily add new checks while still keeping the base
 * flexible.
 */

module.exports = {
  /**
   * If is a HTTP 1.0 request, remove chunk headers
   *
   * @param {ClientRequest} req Request object
   * @param {IncomingMessage} res Response object
   * @param {proxyResponse} proxyRes Response object from the proxy request
   */
  removeChunked: function removeChunked(req, res, proxyRes) {
    if (req.httpVersion === '1.0') {
      delete proxyRes.headers['transfer-encoding']
    }
  },
}
