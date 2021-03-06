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
      proxyRes.headers.connection = req.headers.connection || 'keep-alive'
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
      if (target.host !== u.host) {
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

  /**
   * Copy headers from proxyResponse to response
   * set each header in response object.
   *
   * @param {ClientRequest} req Request object
   * @param {IncomingMessage} res Response object
   * @param {proxyResponse} proxyRes Response object from the proxy request
   * @param {Object} options options.cookieDomainRewrite: Config to rewrite cookie domain
   */
  writeHeaders: function writeHeaders(req, res, proxyRes, options) {
    let rewriteCookieDomainConfig = options.cookieDomainRewrite
    let rewriteCookiePathConfig = options.cookiePathRewrite
    const preserveHeaderKeyCase = options.preserveHeaderKeyCase
    let rawHeaderKeyMap

    const setHeader = (key, header) => {
      if (header == undefined) return
      if (rewriteCookieDomainConfig && key.toLowerCase() === 'set-cookie') {
        header = common.rewriteCookieProperty(header, rewriteCookieDomainConfig, 'domain')
      }
      if (rewriteCookiePathConfig && key.toLowerCase() === 'set-cookie') {
        header = common.rewriteCookieProperty(header, rewriteCookiePathConfig, 'path')
      }

      res.setHeader(String(key).trim(), header)
    }

    if (typeof rewriteCookieDomainConfig === 'string') {
      rewriteCookieDomainConfig = { '*': rewriteCookieDomainConfig }
    }

    if (typeof rewriteCookiePathConfig === 'string') {
      rewriteCookiePathConfig = { '*': rewriteCookiePathConfig }
    }

    if (preserveHeaderKeyCase && proxyRes.rawHeaders != undefined) {
      rawHeaderKeyMap = {}
      for (let i = 0; i < proxyRes.rawHeaders.length; i += 2) {
        let key = proxyRes.rawHeaders[i]
        rawHeaderKeyMap[key.toLowerCase()] = key
      }
    }

    Object.keys(proxyRes.headers).forEach((key) => {
      let header = proxyRes.headers[key]
      if (preserveHeaderKeyCase && rawHeaderKeyMap) {
        key = rawHeaderKeyMap[key] || key
      }
      setHeader(key, header)
    })
  },

  /**
   * Set the statusCode from the proxyResponse
   *
   * @param {ClientRequest} req Request object
   * @param {IncomingMessage} res Response object
   * @param {proxyResponse} proxyRes Response object from the proxy request
   */
  writeStatusCode: function writeStatusCode(req, res, proxyRes) {
    // From Node.js docs: response.writeHead(statusCode[, statusMessage][, headers])
    if (proxyRes.statusMessage) {
      res.statusCode = proxyRes.statusCode
      res.statusMessage = proxyRes.statusMessage
    } else {
      res.statusCode = proxyRes.statusCode
    }
  }
}
