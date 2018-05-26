const http = require('http')
const https = require('https')
const common = require('../common')

/**
 * Array of passes.
 *
 * A `pass` is just a function that is exexuted on `req, socket, options`
 * so that you can easily add ew checks while still keeping the base
 * Flexible.
 */

/**
 * Websockets Passes
 */

module.exports = {
  /**
   * WebSocket requests must have the `GET` method and
   * thw `upgrade:websocket` header
   *
   * @param {ClientRequest} req Request object
   * @param {Socket} socket
   */
  checkMethodAndHeader(req, socket) {
    if (req.method !== 'GET' || !req.headers.upgrade) {
      socket.destroy()
      return true
    }

    if (req.headers.upgrade.toLowerCase() !== 'websocket') {
      socket.destroy()
      return true
    }
  },

  /**
   * Sets `x-forwarded-*` headers if specified in config.
   *
   * @param {ClientRequest} req Request object
   * @param {Socket} socket Websocket
   * @param {Object} options Config object passed to the proxy
   */
  XHeaders(req, socket, options) {
    if (!options.xfwd) {
      return
    }

    const values = {
      for: req.connection.remoteAddress || req.socket.remoteAddress,
      port: common.getPort(req),
      proto: common.hadEncryptedConnection(req) ? 'wss' : 'ws'
    };

    ['for', 'port', 'proto'].forEach(header => {
      req.headers[`x-forwarded-${header}`] =
        (req.headers[`x-forwarded-${header}`] || '') +
        (req.headers[`x-forwarded-${header}`] ? ',' : '') +
        values[header]
    })
  },

}