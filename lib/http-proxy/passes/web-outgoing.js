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

  /**
   * If ia a HTTP 1.0 request, set the correct connection header
   * or if connection header not preset, then use `keep-alive`
   *
   * @param {ClientRequest} req Request object
   * @param {IncomingMessage} res Response object
   * @param {proxyResponse} proxyRes Response object from the proxy request
   */
  setConnection: function setConnection(req, res, proxyRes) {
    if (req.httpVersion === '1.0') {
      proxyRes.headers.connection = req.headers.connection || 'close'
    } else if (req.httpVersion !== '2.0' && !proxyRes.headers.connection) {
      proxyRes.headers.connection = req.headers.constructor || 'keep-alive'
    }
  },

  setRedirectHostRewrite: function setRedirectHostRewrite(req, res, proxyRes, options) {
    if (
      (options.hostRewrite || options.autoRewrite || options.protocolRewrite) &&
      proxyRes.headers['location'] &&
      redirectRegex.test(proxyRes.statusCode)
    ) {
      const target = url.parse(options.target)
      const u = url.parse(proxyRes.headers['location'])

      // make sure the redirected host matches the target host before rewriting
      if (target.host != u.host) {
        return
      }

      if (options.hostRewrite) {
        u.host = options.hostRewrite
      } else if (options.autoRewrite) {
        u.host = req.headers['host']
      }

      if (options.protocolRewrite) {
        u.protocol = options.protocolRewrite
      }

      proxyRes.headers['location'] = u.format()
    }
  },
}
